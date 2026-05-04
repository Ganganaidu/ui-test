import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import {
  Logger,
  LogLevel,
  type DeviceInfo,
  type DeviceInventoryDiagnostic,
  type FeatureOverrides,
  type LogEntry,
  type ModelDefaults,
  type RunTarget,
  type RuntimeBindings,
  type TestResult,
} from '@usb-ui-test/common';
import {
  DevicePreparationError,
  executeTestOnSession,
  isDevicePreparationError,
  prepareTestSession,
  type TestSession,
} from './sessionRunner.js';
import {
  formatResolvedAppSummary,
  type ResolvedAppConfig,
} from './appConfig.js';
import { formatDiagnosticsForOutput } from './deviceInventoryPresenter.js';
import { compileTestObjective } from './testCompiler.js';
import type { ExecutionStatus } from '@usb-ui-test/goal-executor';
import { runCheck, type CheckRunnerOptions, type CheckRunnerResult } from './checkRunner.js';
import { ReportWriter } from './reportWriter.js';
import { rebuildRunIndex } from './runIndex.js';
import type { LoadedEnvironmentConfig } from './testLoader.js';
import {
  formatHostPreflightReport,
  resolveTestRequestedPlatforms,
  runHostPreflight,
  shouldBlockLocalRunPreflight,
} from './hostPreflight.js';
import { CliFilePathUtil } from './filePathUtil.js';
import {
  createRunId,
  resolveWorkspace,
  type UsbUiTestWorkspace,
} from './workspace.js';

export interface TestRunnerOptions extends CheckRunnerOptions {
  apiKeys: Record<string, string>;
  defaults: ModelDefaults;
  features?: FeatureOverrides;
  maxIterations?: number;
  debug?: boolean;
  invokedCommand?: 'test' | 'suite';
}

export interface TestRunnerResult {
  success: boolean;
  status: ExecutionStatus;
  runId: string;
  runDir: string;
  runIndexPath: string;
  testResults: TestResult[];
}

export type PreExecutionFailurePhase = 'validation' | 'setup';

export class PreExecutionFailureError extends Error {
  readonly phase: PreExecutionFailurePhase;
  readonly diagnostics: DeviceInventoryDiagnostic[];
  readonly exitCode: number;

  constructor(params: {
    phase: PreExecutionFailurePhase;
    message: string;
    diagnostics?: DeviceInventoryDiagnostic[];
    exitCode?: number;
  }) {
    super(params.message);
    this.name = 'PreExecutionFailureError';
    this.phase = params.phase;
    this.diagnostics = params.diagnostics ?? [];
    this.exitCode = params.exitCode ?? 1;
  }
}

const CLI_TEST_FORCE_DEVICE_SETUP_FAILURE_ENV_VAR = 'USB_UI_TEST_CLI_TEST_FORCE_DEVICE_SETUP_FAILURE';
const CLI_TEST_SKIP_HOST_PREFLIGHT_ENV_VAR = 'USB_UI_TEST_CLI_TEST_SKIP_HOST_PREFLIGHT';

export const testRunnerDependencies = {
  prepareTestSession: prepareTestSession,
  executeTestOnSession: executeTestOnSession,
  runCheck,
  runHostPreflight,
  resolveWorkspace,
  addSigintListener(listener: () => void): () => void {
    process.on('SIGINT', listener);
    return () => {
      process.removeListener('SIGINT', listener);
    };
  },
  exitProcess(code: number): never {
    process.exit(code);
  },
  /**
   * Returns true when at least one Android device or emulator is already
   * reported as connected by `adb devices`. Used by the host preflight to
   * downgrade the `emulator` binary check from blocking to a warning —
   * the binary is only needed to *boot* an AVD, not to use an attached device.
   */
  async hasConnectedAdbDevice(): Promise<boolean> {
    try {
      const filePathUtil = new CliFilePathUtil(undefined, undefined, { downloadAssets: false });
      const adbPath = await filePathUtil.getADBPath();
      if (!adbPath) return false;
      const { stdout } = await execFileAsync(adbPath, ['devices']);
      // `adb devices` prints a header on line 0; each subsequent line is
      // "<serial>\t<state>". The state string for a ready device is "device".
      const lines = stdout.toString().split('\n').slice(1);
      return lines.some((line) => /\bdevice$/.test(line.trim()));
    } catch {
      return false;
    }
  },
};

export async function runTests(options: TestRunnerOptions): Promise<TestRunnerResult> {
  Logger.init({
    level: options.debug ? LogLevel.DEBUG : LogLevel.INFO,
    resetSinks: true,
  });
  const workspace = await testRunnerDependencies.resolveWorkspace(options.cwd);

  const startedAt = new Date();
  const testResults: TestResult[] = [];
  let encounteredFailure = false;
  let reportWriter: ReportWriter | undefined;
  let runDir = '';
  let logSink: ReturnType<ReportWriter['createLoggerSink']> | undefined;
  let goalSession: TestSession | undefined;
  const bufferedLogEntries: LogEntry[] = [];
  const bufferingSink = (entry: LogEntry) => {
    bufferedLogEntries.push(entry);
  };
  Logger.addSink(bufferingSink);
  const runAbortController = new AbortController();
  let runAborted = false;
  const requestRunAbort = (): void => {
    if (runAborted) {
      Logger.e('\nReceived second SIGINT — forcing exit.');
      reportWriter?.appendLogLine('Received second SIGINT — forcing exit.');
      testRunnerDependencies.exitProcess(130);
    }

    runAborted = true;
    Logger.w('\nReceived SIGINT — aborting run...');
    runAbortController.abort();
  };
  const removeSigintListener = testRunnerDependencies.addSigintListener(requestRunAbort);

  try {
    let checked: CheckRunnerResult;
    let effectiveGoals = new Map<string, string>();
    try {
      checked = await testRunnerDependencies.runCheck({
        ...options,
        requireSelection: true,
      });
      effectiveGoals = new Map(
        checked.tests.map((t) => [
          t.testId!,
          compileTestObjective(t, checked.environment.bindings),
        ]),
      );
    } catch (error) {
      if (error instanceof PreExecutionFailureError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new PreExecutionFailureError({
        phase: 'validation',
        message,
        exitCode: runAborted ? 130 : 1,
      });
    }

    if (runAborted) {
      throw new PreExecutionFailureError({
        phase: 'setup',
        message: 'Run aborted before execution.',
        exitCode: 130,
      });
    }

    try {
      const requestedPlatforms = resolveTestRequestedPlatforms(
        checked.resolvedApp.platform,
      );
      Logger.i(formatResolvedAppSummary(checked.resolvedApp));
      const preflight =
        process.env[CLI_TEST_SKIP_HOST_PREFLIGHT_ENV_VAR] === '1'
          ? {
              requestedPlatforms,
              checks: [],
            }
          : await testRunnerDependencies.runHostPreflight({
              requestedPlatforms,
              // Downgrade scrcpy to a warning when every selected test is
              // deterministic — those never record the screen.
              skipRecording: checked.tests.every((t) => t.mode === 'deterministic'),
              // Downgrade emulator to a warning when a physical device is
              // already connected — no AVD boot is needed.
              hasConnectedDevice: await testRunnerDependencies.hasConnectedAdbDevice(),
            });
      if (shouldBlockLocalRunPreflight(preflight)) {
        throw new PreExecutionFailureError({
          phase: 'setup',
          message: `Run setup failed before execution: ${formatHostPreflightReport(preflight, 'test')}`,
          exitCode: runAborted ? 130 : 1,
        });
      }

      if (runAborted) {
        throw new PreExecutionFailureError({
          phase: 'setup',
          message: 'Run aborted before execution.',
          exitCode: 130,
        });
      }

      const forcedDeviceSetupFailure = process.env[CLI_TEST_FORCE_DEVICE_SETUP_FAILURE_ENV_VAR];
      if (forcedDeviceSetupFailure) {
        throw new DevicePreparationError(forcedDeviceSetupFailure);
      }
      goalSession = await testRunnerDependencies.prepareTestSession({
        platform: checked.resolvedApp.platform,
        appOverridePath: checked.appOverride?.appPath,
        app: checked.resolvedApp,
      });
    } catch (error) {
      if (error instanceof PreExecutionFailureError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      const diagnostics = isDevicePreparationError(error) ? error.diagnostics : [];
      throw new PreExecutionFailureError({
        phase: 'setup',
        message: formatPreExecutionFailureMessage(
          `Run setup failed before execution: ${message}`,
          diagnostics,
        ),
        diagnostics,
        exitCode: runAborted ? 130 : 1,
      });
    }

    if (runAborted) {
      throw new PreExecutionFailureError({
        phase: 'setup',
        message: 'Run aborted before execution.',
        exitCode: 130,
      });
    }

    try {
      for (const test of checked.tests) {
        if (runAborted) {
          if (!reportWriter) {
            throw new PreExecutionFailureError({
              phase: 'setup',
              message: 'Run aborted before execution.',
              exitCode: 130,
            });
          }
          break;
        }

        if (!reportWriter) {
          ({ reportWriter, runDir } = await createReportWriter({
            workspace,
            envName: checked.environment.envName,
            platform: goalSession.platform,
            startedAt,
            bindings: checked.environment.bindings,
          }));
          logSink = reportWriter.createLoggerSink();
          flushBufferedLogEntries(bufferedLogEntries, logSink);
          Logger.removeSink(bufferingSink);
          Logger.addSink(logSink);
          await reportWriter.writeRunInputs({
            workspaceRoot: checked.workspace.rootDir,
            environment: checked.environment,
            tests: checked.tests,
            effectiveGoals,
            cli: buildCliContext(options),
            model: buildModelContext(options.defaults.provider, options.defaults.modelName),
            ...(options.defaults.reasoning !== undefined
              ? { reasoning: options.defaults.reasoning }
              : {}),
            ...(options.features !== undefined ? { features: options.features } : {}),
            app: buildAppContext(checked.resolvedApp, checked.appOverride?.appPath ?? options.appPath),
            target: checked.target,
            suite: checked.suite,
          });
          reportWriter.appendLogLine(`Starting UsbUiTest test run ${path.basename(runDir)}`);
        }
        reportWriter.appendLogLine(`Running test ${test.relativePath}`);
        const testStartedAt = new Date().toISOString();

        try {
          const goal =
            effectiveGoals.get(test.testId!) ??
            compileTestObjective(test, checked.environment.bindings);
          const recordingExtension = goalSession.platform === 'android' ? '.mp4' : '.mov';
          const recordingOutputPath = path.join(
            runDir,
            'tests',
            test.testId!,
            `recording${recordingExtension}`,
          );
          const goalResult = await testRunnerDependencies.executeTestOnSession(goalSession, {
            goal,
            apiKeys: options.apiKeys,
            defaults: options.defaults,
            features: options.features,
            maxIterations: options.maxIterations,
            debug: options.debug,
            runtimeBindings: checked.environment.bindings,
            abortSignal: runAbortController.signal,
            // Forward the parsed mode + structured steps so deterministic
            // tests skip the AI agent and run via @usb-ui-test/local-executor.
            // For AI-mode tests these stay undefined and the existing flow runs.
            ...(test.mode ? { mode: test.mode } : {}),
            ...(test.structuredSteps
              ? { structuredSteps: test.structuredSteps as never }
              : {}),
            recording: {
              runId: path.basename(runDir),
              testId: test.testId!,
              outputFilePath: recordingOutputPath,
              keepPartialOnFailure: true,
            },
            deviceLog: {
              runId: path.basename(runDir),
              testId: test.testId!,
              keepPartialOnFailure: true,
            },
          });

          const testRecord = await reportWriter.writeTestRecord(
            test,
            goalResult,
            checked.environment.bindings,
          );
          testResults.push(testRecord);
          encounteredFailure ||= !goalResult.success;
          if (goalResult.status === 'aborted' || runAborted) {
            runAborted = true;
            reportWriter.appendLogLine(`Run aborted while executing test ${test.relativePath}.`);
            break;
          }
          if (goalResult.terminalFailure) {
            reportWriter.appendLogLine(
              `Stopping run after terminal AI provider failure in ${test.relativePath}: ${goalResult.terminalFailure.message}`,
            );
            break;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          encounteredFailure = true;
          reportWriter.appendLogLine(
            `Test ${test.relativePath} failed before completion: ${message}`,
          );
          testResults.push(
            await reportWriter.writeTestFailureRecord({
              test: test,
              bindings: checked.environment.bindings,
              message,
              platform: goalSession.platform,
              startedAt: testStartedAt,
              completedAt: new Date().toISOString(),
            }),
          );
          break;
        }
      }

      const success =
        !runAborted && !encounteredFailure && testResults.every((t) => t.success);
      const runStatus: ExecutionStatus = runAborted
        ? 'aborted'
        : success
          ? 'success'
          : 'failure';
      if (!reportWriter) {
        throw new Error('Report writer was not initialized before execution completed.');
      }
      await reportWriter.finalize({
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        tests: testResults,
        successOverride: success,
        statusOverride: runStatus,
        failurePhase: runStatus === 'failure' && encounteredFailure ? 'execution' : undefined,
      });
      await rebuildRunIndex(workspace.artifactsDir);

      return {
        success,
        status: runStatus,
        runId: path.basename(runDir),
        runDir,
        runIndexPath: path.join(workspace.artifactsDir, 'runs.json'),
        testResults,
      };
    } finally {
      if (goalSession) {
        try {
          await goalSession.cleanup();
        } catch (error) {
          Logger.w('Failed to clean up device resources:', error);
        }
      }
      if (logSink) {
        Logger.removeSink(logSink);
      }
      Logger.removeSink(bufferingSink);
    }
  } finally {
    removeSigintListener();
  }
}

export function selectExecutionPlatform(
  devices: Array<Pick<DeviceInfo, 'getPlatform'>>,
  preferredPlatform?: string,
): string {
  const availablePlatforms = new Set(devices.map((device) => device.getPlatform()));
  if (preferredPlatform) {
    const matchingPlatform = preferredPlatform.toLowerCase();
    const match = devices.some((device) => device.getPlatform() === matchingPlatform);
    if (!match) {
      throw new Error(`No ${preferredPlatform} devices found.`);
    }
    return matchingPlatform;
  }

  if (availablePlatforms.size > 1) {
    throw new Error(
      'Multiple platforms are available. Choose --platform android or --platform ios.',
    );
  }

  return devices[0]!.getPlatform();
}

async function createReportWriter(params: {
  workspace: UsbUiTestWorkspace;
  envName: string;
  platform: string;
  startedAt: Date;
  bindings: RuntimeBindings;
}): Promise<{ reportWriter: ReportWriter; runDir: string }> {
  const runId = createRunId({
    envName: params.envName,
    platform: params.platform,
    startedAt: params.startedAt,
  });
  const runDir = path.join(params.workspace.artifactsDir, runId);
  const reportWriter = new ReportWriter({
    runDir,
    envName: params.envName,
    platform: params.platform,
    runId,
    bindings: params.bindings,
  });
  await reportWriter.init();
  return { reportWriter, runDir };
}

function flushBufferedLogEntries(
  entries: LogEntry[],
  sink: ReturnType<ReportWriter['createLoggerSink']>,
): void {
  for (const entry of entries) {
    sink(entry);
  }
  entries.length = 0;
}

function buildCliContext(options: TestRunnerOptions): {
  command: string;
  selectors: string[];
  suitePath?: string;
  requestedPlatform?: string;
  appOverridePath?: string;
  debug: boolean;
  maxIterations?: number;
} {
  const invokedCommand = options.invokedCommand ?? 'test';
  const commandParts = ['usb-ui-test', invokedCommand];
  if (invokedCommand === 'suite' && options.suitePath) {
    commandParts.push(options.suitePath);
  }
  return {
    command: commandParts.join(' '),
    selectors: options.selectors ?? [],
    suitePath: options.suitePath,
    requestedPlatform: options.platform,
    appOverridePath: options.appPath,
    debug: options.debug === true,
    maxIterations: options.maxIterations,
  };
}

function buildModelContext(
  provider: string | undefined,
  modelName: string | undefined,
): {
  provider: string;
  modelName: string;
  label: string;
} {
  const resolvedProvider = provider ?? 'unknown';
  const resolvedModelName = modelName ?? 'unknown';
  return {
    provider: resolvedProvider,
    modelName: resolvedModelName,
    label: `${resolvedProvider}/${resolvedModelName}`,
  };
}

function buildAppContext(
  resolvedApp: ResolvedAppConfig,
  appOverridePath?: string,
): {
  source: 'config';
  label: string;
  identifier: string;
  identifierKind: 'packageName' | 'bundleId';
  name?: string;
  sourceEnvName?: string;
  overridePath?: string;
} {
  return {
    source: 'config',
    label: resolvedApp.name
      ? `${resolvedApp.name} (${resolvedApp.identifier})`
      : resolvedApp.identifier,
    identifier: resolvedApp.identifier,
    identifierKind: resolvedApp.identifierKind,
    name: resolvedApp.name,
    sourceEnvName: resolvedApp.sourceEnvName,
    overridePath: appOverridePath,
  };
}

function formatPreExecutionFailureMessage(
  message: string,
  diagnostics: DeviceInventoryDiagnostic[],
): string {
  if (diagnostics.length === 0) {
    return message;
  }
  return `${message}\n\n${formatDiagnosticsForOutput(diagnostics)}`;
}
