"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRunnerDependencies = exports.PreExecutionFailureError = void 0;
exports.runTests = runTests;
exports.selectExecutionPlatform = selectExecutionPlatform;
const path = __importStar(require("node:path"));
const node_child_process_1 = require("node:child_process");
const node_util_1 = require("node:util");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const common_1 = require("@usb-ui-test/common");
const sessionRunner_js_1 = require("./sessionRunner.js");
const appConfig_js_1 = require("./appConfig.js");
const deviceInventoryPresenter_js_1 = require("./deviceInventoryPresenter.js");
const testCompiler_js_1 = require("./testCompiler.js");
const checkRunner_js_1 = require("./checkRunner.js");
const reportWriter_js_1 = require("./reportWriter.js");
const runIndex_js_1 = require("./runIndex.js");
const hostPreflight_js_1 = require("./hostPreflight.js");
const filePathUtil_js_1 = require("./filePathUtil.js");
const workspace_js_1 = require("./workspace.js");
class PreExecutionFailureError extends Error {
    phase;
    diagnostics;
    exitCode;
    constructor(params) {
        super(params.message);
        this.name = 'PreExecutionFailureError';
        this.phase = params.phase;
        this.diagnostics = params.diagnostics ?? [];
        this.exitCode = params.exitCode ?? 1;
    }
}
exports.PreExecutionFailureError = PreExecutionFailureError;
const CLI_TEST_FORCE_DEVICE_SETUP_FAILURE_ENV_VAR = 'USB_UI_TEST_CLI_TEST_FORCE_DEVICE_SETUP_FAILURE';
const CLI_TEST_SKIP_HOST_PREFLIGHT_ENV_VAR = 'USB_UI_TEST_CLI_TEST_SKIP_HOST_PREFLIGHT';
exports.testRunnerDependencies = {
    prepareTestSession: sessionRunner_js_1.prepareTestSession,
    executeTestOnSession: sessionRunner_js_1.executeTestOnSession,
    runCheck: checkRunner_js_1.runCheck,
    runHostPreflight: hostPreflight_js_1.runHostPreflight,
    resolveWorkspace: workspace_js_1.resolveWorkspace,
    addSigintListener(listener) {
        process.on('SIGINT', listener);
        return () => {
            process.removeListener('SIGINT', listener);
        };
    },
    exitProcess(code) {
        process.exit(code);
    },
    /**
     * Returns true when at least one Android device or emulator is already
     * reported as connected by `adb devices`. Used by the host preflight to
     * downgrade the `emulator` binary check from blocking to a warning —
     * the binary is only needed to *boot* an AVD, not to use an attached device.
     */
    async hasConnectedAdbDevice() {
        try {
            const filePathUtil = new filePathUtil_js_1.CliFilePathUtil(undefined, undefined, { downloadAssets: false });
            const adbPath = await filePathUtil.getADBPath();
            if (!adbPath)
                return false;
            const { stdout } = await execFileAsync(adbPath, ['devices']);
            // `adb devices` prints a header on line 0; each subsequent line is
            // "<serial>\t<state>". The state string for a ready device is "device".
            const lines = stdout.toString().split('\n').slice(1);
            return lines.some((line) => /\bdevice$/.test(line.trim()));
        }
        catch {
            return false;
        }
    },
};
async function runTests(options) {
    common_1.Logger.init({
        level: options.debug ? common_1.LogLevel.DEBUG : common_1.LogLevel.INFO,
        resetSinks: true,
    });
    const workspace = await exports.testRunnerDependencies.resolveWorkspace(options.cwd);
    const startedAt = new Date();
    const testResults = [];
    let encounteredFailure = false;
    let reportWriter;
    let runDir = '';
    let logSink;
    let goalSession;
    const bufferedLogEntries = [];
    const bufferingSink = (entry) => {
        bufferedLogEntries.push(entry);
    };
    common_1.Logger.addSink(bufferingSink);
    const runAbortController = new AbortController();
    let runAborted = false;
    const requestRunAbort = () => {
        if (runAborted) {
            common_1.Logger.e('\nReceived second SIGINT — forcing exit.');
            reportWriter?.appendLogLine('Received second SIGINT — forcing exit.');
            exports.testRunnerDependencies.exitProcess(130);
        }
        runAborted = true;
        common_1.Logger.w('\nReceived SIGINT — aborting run...');
        runAbortController.abort();
    };
    const removeSigintListener = exports.testRunnerDependencies.addSigintListener(requestRunAbort);
    try {
        let checked;
        let effectiveGoals = new Map();
        try {
            checked = await exports.testRunnerDependencies.runCheck({
                ...options,
                requireSelection: true,
            });
            effectiveGoals = new Map(checked.tests.map((t) => [
                t.testId,
                (0, testCompiler_js_1.compileTestObjective)(t, checked.environment.bindings),
            ]));
        }
        catch (error) {
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
            const requestedPlatforms = (0, hostPreflight_js_1.resolveTestRequestedPlatforms)(checked.resolvedApp.platform);
            common_1.Logger.i((0, appConfig_js_1.formatResolvedAppSummary)(checked.resolvedApp));
            const preflight = process.env[CLI_TEST_SKIP_HOST_PREFLIGHT_ENV_VAR] === '1'
                ? {
                    requestedPlatforms,
                    checks: [],
                }
                : await exports.testRunnerDependencies.runHostPreflight({
                    requestedPlatforms,
                    // Downgrade scrcpy to a warning when every selected test is
                    // deterministic — those never record the screen.
                    skipRecording: checked.tests.every((t) => t.mode === 'deterministic'),
                    // Downgrade emulator to a warning when a physical device is
                    // already connected — no AVD boot is needed.
                    hasConnectedDevice: await exports.testRunnerDependencies.hasConnectedAdbDevice(),
                });
            if ((0, hostPreflight_js_1.shouldBlockLocalRunPreflight)(preflight)) {
                throw new PreExecutionFailureError({
                    phase: 'setup',
                    message: `Run setup failed before execution: ${(0, hostPreflight_js_1.formatHostPreflightReport)(preflight, 'test')}`,
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
                throw new sessionRunner_js_1.DevicePreparationError(forcedDeviceSetupFailure);
            }
            goalSession = await exports.testRunnerDependencies.prepareTestSession({
                platform: checked.resolvedApp.platform,
                appOverridePath: checked.appOverride?.appPath,
                app: checked.resolvedApp,
            });
        }
        catch (error) {
            if (error instanceof PreExecutionFailureError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            const diagnostics = (0, sessionRunner_js_1.isDevicePreparationError)(error) ? error.diagnostics : [];
            throw new PreExecutionFailureError({
                phase: 'setup',
                message: formatPreExecutionFailureMessage(`Run setup failed before execution: ${message}`, diagnostics),
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
                    common_1.Logger.removeSink(bufferingSink);
                    common_1.Logger.addSink(logSink);
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
                    const goal = effectiveGoals.get(test.testId) ??
                        (0, testCompiler_js_1.compileTestObjective)(test, checked.environment.bindings);
                    const recordingExtension = goalSession.platform === 'android' ? '.mp4' : '.mov';
                    const recordingOutputPath = path.join(runDir, 'tests', test.testId, `recording${recordingExtension}`);
                    const goalResult = await exports.testRunnerDependencies.executeTestOnSession(goalSession, {
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
                            ? { structuredSteps: test.structuredSteps }
                            : {}),
                        recording: {
                            runId: path.basename(runDir),
                            testId: test.testId,
                            outputFilePath: recordingOutputPath,
                            keepPartialOnFailure: true,
                        },
                        deviceLog: {
                            runId: path.basename(runDir),
                            testId: test.testId,
                            keepPartialOnFailure: true,
                        },
                    });
                    const testRecord = await reportWriter.writeTestRecord(test, goalResult, checked.environment.bindings);
                    testResults.push(testRecord);
                    encounteredFailure ||= !goalResult.success;
                    if (goalResult.status === 'aborted' || runAborted) {
                        runAborted = true;
                        reportWriter.appendLogLine(`Run aborted while executing test ${test.relativePath}.`);
                        break;
                    }
                    if (goalResult.terminalFailure) {
                        reportWriter.appendLogLine(`Stopping run after terminal AI provider failure in ${test.relativePath}: ${goalResult.terminalFailure.message}`);
                        break;
                    }
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    encounteredFailure = true;
                    reportWriter.appendLogLine(`Test ${test.relativePath} failed before completion: ${message}`);
                    testResults.push(await reportWriter.writeTestFailureRecord({
                        test: test,
                        bindings: checked.environment.bindings,
                        message,
                        platform: goalSession.platform,
                        startedAt: testStartedAt,
                        completedAt: new Date().toISOString(),
                    }));
                    break;
                }
            }
            const success = !runAborted && !encounteredFailure && testResults.every((t) => t.success);
            const runStatus = runAborted
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
            await (0, runIndex_js_1.rebuildRunIndex)(workspace.artifactsDir);
            return {
                success,
                status: runStatus,
                runId: path.basename(runDir),
                runDir,
                runIndexPath: path.join(workspace.artifactsDir, 'runs.json'),
                testResults,
            };
        }
        finally {
            if (goalSession) {
                try {
                    await goalSession.cleanup();
                }
                catch (error) {
                    common_1.Logger.w('Failed to clean up device resources:', error);
                }
            }
            if (logSink) {
                common_1.Logger.removeSink(logSink);
            }
            common_1.Logger.removeSink(bufferingSink);
        }
    }
    finally {
        removeSigintListener();
    }
}
function selectExecutionPlatform(devices, preferredPlatform) {
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
        throw new Error('Multiple platforms are available. Choose --platform android or --platform ios.');
    }
    return devices[0].getPlatform();
}
async function createReportWriter(params) {
    const runId = (0, workspace_js_1.createRunId)({
        envName: params.envName,
        platform: params.platform,
        startedAt: params.startedAt,
    });
    const runDir = path.join(params.workspace.artifactsDir, runId);
    const reportWriter = new reportWriter_js_1.ReportWriter({
        runDir,
        envName: params.envName,
        platform: params.platform,
        runId,
        bindings: params.bindings,
    });
    await reportWriter.init();
    return { reportWriter, runDir };
}
function flushBufferedLogEntries(entries, sink) {
    for (const entry of entries) {
        sink(entry);
    }
    entries.length = 0;
}
function buildCliContext(options) {
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
function buildModelContext(provider, modelName) {
    const resolvedProvider = provider ?? 'unknown';
    const resolvedModelName = modelName ?? 'unknown';
    return {
        provider: resolvedProvider,
        modelName: resolvedModelName,
        label: `${resolvedProvider}/${resolvedModelName}`,
    };
}
function buildAppContext(resolvedApp, appOverridePath) {
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
function formatPreExecutionFailureMessage(message, diagnostics) {
    if (diagnostics.length === 0) {
        return message;
    }
    return `${message}\n\n${(0, deviceInventoryPresenter_js_1.formatDiagnosticsForOutput)(diagnostics)}`;
}
//# sourceMappingURL=testRunner.js.map