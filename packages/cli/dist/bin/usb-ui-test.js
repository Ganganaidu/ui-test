#!/usr/bin/env node
"use strict";
// CLI entry point — parses arguments and runs the goal.
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const common_1 = require("@usb-ui-test/common");
const appConfig_js_1 = require("../src/appConfig.js");
const env_js_1 = require("../src/env.js");
const apiKey_js_1 = require("../src/apiKey.js");
const checkRunner_js_1 = require("../src/checkRunner.js");
const testSelection_js_1 = require("../src/testSelection.js");
const runIndex_js_1 = require("../src/runIndex.js");
const runtimePaths_js_1 = require("../src/runtimePaths.js");
const workspace_js_1 = require("../src/workspace.js");
const workspacePicker_js_1 = require("../src/workspacePicker.js");
const localRuntime_js_1 = require("../src/localRuntime.js");
const upgradeCommand_js_1 = require("../src/upgradeCommand.js");
// ============================================================================
// CLI definition
// ============================================================================
(0, runtimePaths_js_1.initializeCliRuntimeEnvironment)();
const program = new commander_1.Command()
    .name('usb-ui-test')
    .description('AI-driven mobile app testing from the terminal')
    .version((0, runtimePaths_js_1.resolveCliPackageVersion)());
program
    .command('check')
    .description('Validate the .usb-ui-test workspace, env config, and test files')
    .option('--env <name>', 'Environment name (for example dev or staging)')
    .option('--platform <platform>', 'Target platform (android or ios)')
    .option('--app <path>', 'Optional app override (.apk or .app)')
    .option('--suite <path>', 'Suite manifest under .usb-ui-test/suites')
    .argument('[selectors...]', 'Optional YAML files, directories, or globs under .usb-ui-test/tests/')
    .action(async (selectors, options) => {
    await runCommand(async () => {
        common_1.Logger.init({ level: common_1.LogLevel.INFO, resetSinks: true });
        const normalizedSelectors = (0, testSelection_js_1.normalizeTestSelectors)(selectors);
        if (options.suite && normalizedSelectors.length > 0) {
            throw new Error(checkRunner_js_1.SUITE_SELECTOR_CONFLICT_ERROR);
        }
        const result = await (0, checkRunner_js_1.runCheck)({
            envName: options.env,
            selectors: normalizedSelectors,
            suitePath: options.suite,
            platform: options.platform,
            appPath: options.app,
        });
        const envSummary = result.environment.envName === 'none'
            ? 'using no env bindings.'
            : `using env ${result.environment.envName}.`;
        console.log((0, appConfig_js_1.formatResolvedAppSummary)(result.resolvedApp));
        console.log(`Validated ${result.tests.length} test(s) in ${result.workspace.testsDir} ${envSummary}`);
    });
});
program
    .command('doctor')
    .description('Check mac host readiness for local UsbUiTest device runs')
    .option('--platform <platform>', 'Target platform (android, ios, or all)')
    .action(async (options) => {
    await runCommand(async () => {
        common_1.Logger.init({ level: common_1.LogLevel.WARN, resetSinks: true });
        const { doctorRunner } = await (0, localRuntime_js_1.resolveLocalRuntime)();
        const result = await doctorRunner.runDoctorCommand({
            platform: options.platform,
            output: process.stdout,
        });
        if (!result.success) {
            process.exit(1);
        }
    });
});
program
    .command('runs')
    .description('List local UsbUiTest reports from the workspace-scoped artifact store')
    .option('--workspace <path>', 'Workspace root or a path inside a UsbUiTest workspace')
    .option('--json', 'Print the runs index as JSON', false)
    .action(async (options) => {
    await runCommand(async () => {
        const workspace = await resolveCommandWorkspace(options.workspace, options.json ? process.stderr : process.stdout);
        const index = await (0, runIndex_js_1.loadRunIndex)(workspace.artifactsDir);
        if (options.json) {
            console.log(JSON.stringify(index, null, 2));
            return;
        }
        console.log((0, runIndex_js_1.formatRunIndexForConsole)(index));
        if (index.runs.length > 0) {
            // The report-server URL hint requires the local runtime; if it's not
            // installed we silently skip it rather than failing the run listing.
            try {
                const { reportServerManager } = await (0, localRuntime_js_1.resolveLocalRuntime)();
                const activeServer = await reportServerManager.resolveHealthyWorkspaceReportServer(workspace);
                if (activeServer) {
                    console.log(`\nReport server: ${reportServerManager.buildWorkspaceReportUrl(activeServer.url)}`);
                }
                else {
                    console.log(`\nRun \`usb-ui-test start-server --workspace ${JSON.stringify(workspace.rootDir)}\` to browse reports in the local web UI.`);
                }
            }
            catch (e) {
                if (!(e instanceof localRuntime_js_1.LocalRuntimeMissingError)) {
                    throw e;
                }
                // Local runtime missing — listing runs still works; just skip the URL hint.
            }
        }
    });
});
program
    .command('test')
    .description('Run repo-local UsbUiTest YAML tests from .usb-ui-test/tests')
    .option('--env <name>', 'Environment name (for example dev or staging)')
    .option('--platform <platform>', 'Target platform (android or ios)')
    .option('--app <path>', 'Optional app override (.apk or .app)')
    .option('--api-key <key>', 'API key for the LLM provider')
    .option('--model <provider/model>', `LLM model in provider/model format (for example ${env_js_1.MODEL_FORMAT_EXAMPLE})`)
    .option('--debug', 'Enable debug logging', false)
    .option('--max-iterations <n>', 'Maximum iterations before giving up', '110')
    .argument('[selectors...]', 'Workspace-relative YAML files, directories, or globs under .usb-ui-test/tests')
    .action(async (selectors, options) => {
    await runTestCommand({
        invokedCommand: 'test',
        selectors,
        options,
    });
});
program
    .command('suite')
    .description('Run repo-local UsbUiTest suite manifests from .usb-ui-test/suites')
    .option('--env <name>', 'Environment name (for example dev or staging)')
    .option('--platform <platform>', 'Target platform (android or ios)')
    .option('--app <path>', 'Optional app override (.apk or .app)')
    .option('--api-key <key>', 'API key for the LLM provider')
    .option('--model <provider/model>', `LLM model in provider/model format (for example ${env_js_1.MODEL_FORMAT_EXAMPLE})`)
    .option('--debug', 'Enable debug logging', false)
    .option('--max-iterations <n>', 'Maximum iterations before giving up', '110')
    .argument('<suitePath>', 'Workspace-relative YAML file under .usb-ui-test/suites')
    .action(async (suitePath, options) => {
    await runTestCommand({
        invokedCommand: 'suite',
        suitePath,
        options,
    });
});
program
    .command('start-server')
    .description('Start or reuse the local UsbUiTest report server for a workspace')
    .option('--workspace <path>', 'Workspace root or a path inside a UsbUiTest workspace')
    .option('--port <n>', 'Preferred port to bind to', '4173')
    .option('--dev', 'Run the report server in Next.js development mode', false)
    .action(async (options) => {
    await runCommand(async () => {
        await startWorkspaceReportServer({
            workspacePath: options.workspace,
            preferredPort: parsePortOption(options.port, 4173),
            dev: options.dev === true,
        });
    });
});
program
    .command('stop-server')
    .description('Stop the local UsbUiTest report server for a workspace')
    .option('--workspace <path>', 'Workspace root or a path inside a UsbUiTest workspace')
    .action(async (options) => {
    await runCommand(async () => {
        await stopWorkspaceReportServerCommand(options.workspace);
    });
});
program
    .command('server-status')
    .description('Show the local UsbUiTest report server status for a workspace')
    .option('--workspace <path>', 'Workspace root or a path inside a UsbUiTest workspace')
    .action(async (options) => {
    await runCommand(async () => {
        await printWorkspaceReportServerStatus(options.workspace);
    });
});
program
    .command('upgrade')
    .description('Upgrade the usb-ui-test CLI by re-running the install script')
    .option('--version <version>', 'Pin to a specific version (default: latest GitHub release)')
    .option('--ci', 'Install only the binary (skip runtime tarball + prompts)')
    .action(async (options) => {
    await runCommand(async () => {
        await (0, upgradeCommand_js_1.runUpgrade)({
            version: options.version,
            ci: options.ci === true,
        });
    });
});
program
    .command('internal-report-server', { hidden: true })
    .option('--workspace-root <path>', 'Workspace root', '')
    .option('--artifacts-dir <path>', 'Artifacts directory', '')
    .option('--port <n>', 'Port to bind to', '4173')
    .option('--mode <mode>', 'Internal report server mode', 'production')
    .action(async (options) => {
    await runCommand(async () => {
        const { reportServer } = await (0, localRuntime_js_1.resolveLocalRuntime)();
        const server = await reportServer.serveReportWorkspace({
            workspaceRoot: options.workspaceRoot,
            artifactsDir: options.artifactsDir,
            port: parsePortOption(options.port, 4173),
        });
        const shutdown = async (exitCode) => {
            try {
                await server.close();
            }
            catch {
                // ignore shutdown errors for the detached server process
            }
            process.exit(exitCode);
        };
        process.on('SIGINT', () => {
            void shutdown(0);
        });
        process.on('SIGTERM', () => {
            void shutdown(0);
        });
    });
});
program.parse();
async function runTestCommand(params) {
    try {
        const normalizedSelectors = (0, testSelection_js_1.normalizeTestSelectors)(params.selectors);
        const normalizedSuitePath = params.suitePath?.trim();
        if (normalizedSelectors.length === 0 && !normalizedSuitePath) {
            throw new Error(testSelection_js_1.TEST_SELECTION_REQUIRED_ERROR);
        }
        const workspace = await (0, workspace_js_1.resolveWorkspace)();
        const workspaceConfig = await (0, workspace_js_1.loadWorkspaceConfig)(workspace.usbUiTestDir);
        // parseModelOptional returns undefined when --model is omitted so that
        // deterministic tests (no AI provider needed) can run without the flag.
        // AI-mode tests will receive an empty provider string and sessionRunner
        // will throw a descriptive error before any provider call is attempted.
        const model = (0, env_js_1.parseModelOptional)(params.options.model ?? workspaceConfig.model);
        const features = workspaceConfig.features;
        const reasoning = workspaceConfig.reasoning;
        const requiredProviders = new Set();
        if (model)
            requiredProviders.add(model.provider);
        if (features) {
            for (const override of Object.values(features)) {
                if (override?.model) {
                    requiredProviders.add((0, env_js_1.parseModel)(override.model).provider);
                }
            }
        }
        const debug = params.options.debug === true;
        common_1.Logger.init({ level: debug ? common_1.LogLevel.DEBUG : common_1.LogLevel.INFO, resetSinks: true });
        const resolvedEnvironment = await (0, workspace_js_1.resolveConfiguredEnvironmentFile)(workspace, params.options.env);
        const runtimeEnv = new env_js_1.CliEnv();
        runtimeEnv.load(resolvedEnvironment.usesEmptyBindings
            ? undefined
            : resolvedEnvironment.envName, { cwd: workspace.rootDir });
        // Skip API key resolution entirely for all-deterministic runs (no providers).
        const apiKeys = requiredProviders.size > 0
            ? (0, apiKey_js_1.resolveApiKeys)({
                env: runtimeEnv,
                providers: requiredProviders,
                providedApiKey: params.options.apiKey,
            })
            : {};
        const runtime = await (0, localRuntime_js_1.resolveLocalRuntime)();
        const reportServerUrl = await tryStartReportServer(workspace, runtime);
        const result = await runtime.testRunner.runTests({
            envName: resolvedEnvironment.usesEmptyBindings ? undefined : resolvedEnvironment.envName,
            selectors: normalizedSelectors,
            suitePath: normalizedSuitePath,
            platform: params.options.platform,
            appPath: params.options.app,
            apiKeys,
            defaults: {
                provider: model?.provider ?? '',
                modelName: model?.modelName ?? '',
                reasoning,
            },
            features,
            maxIterations: parseInt(params.options.maxIterations, 10) || 110,
            debug,
            invokedCommand: params.invokedCommand,
        });
        const runUrl = reportServerUrl
            ? runtime.reportServerManager.buildRunReportUrl(reportServerUrl, result.runId)
            : undefined;
        if (result.success) {
            printSuccessSummary(result, runUrl);
        }
        else {
            printFailureSummary(result, runUrl);
        }
        if (runUrl) {
            await openUrlBestEffort(runUrl, runtime);
        }
        process.exit(result.status === 'aborted' ? 130 : result.success ? 0 : 1);
    }
    catch (error) {
        // Need the runtime modules to format pre-execution errors properly. If the
        // runtime isn't installed, the resolver throws LocalRuntimeMissingError
        // first; otherwise we can safely import the error type here.
        if (error instanceof localRuntime_js_1.LocalRuntimeMissingError) {
            await exitWithRawStderr(error.message, error.exitCode);
            return;
        }
        try {
            const { testRunner } = await (0, localRuntime_js_1.resolveLocalRuntime)();
            if (error instanceof testRunner.PreExecutionFailureError) {
                await exitWithRawStderr(error.message, error.exitCode);
                return;
            }
        }
        catch {
            // Runtime not available — fall through to generic error formatting.
        }
        const message = error instanceof Error ? error.message : String(error);
        await exitWithRawStderr(message, 1);
    }
}
async function runCommand(run) {
    try {
        await run();
    }
    catch (error) {
        if (error instanceof workspacePicker_js_1.WorkspaceSelectionCancelledError) {
            process.exit(error.exitCode);
        }
        if (error instanceof localRuntime_js_1.LocalRuntimeMissingError) {
            // Already-formatted user-facing message; render verbatim without the
            // "Error:" prefix that the generic branch adds.
            process.stderr.write(`${error.message}\n`);
            process.exit(error.exitCode);
        }
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`\n\x1b[31m✖ Error:\x1b[0m ${msg}\n`);
        process.exit(1);
    }
}
async function startWorkspaceReportServer(params) {
    const runtime = await (0, localRuntime_js_1.resolveLocalRuntime)();
    const workspace = await resolveCommandWorkspace(params.workspacePath);
    await (0, runIndex_js_1.loadRunIndex)(workspace.artifactsDir);
    const server = await runtime.reportServerManager.startOrReuseWorkspaceReportServer({
        workspace,
        requestedPort: params.preferredPort,
        dev: params.dev,
    });
    const workspaceUrl = runtime.reportServerManager.buildWorkspaceReportUrl(server.url);
    console.log(`${server.reused ? 'Reusing' : 'Started'} UsbUiTest report server at ${workspaceUrl}`);
    await openUrlBestEffort(workspaceUrl, runtime);
}
async function stopWorkspaceReportServerCommand(workspacePath) {
    const runtime = await (0, localRuntime_js_1.resolveLocalRuntime)();
    const workspace = await resolveCommandWorkspace(workspacePath);
    const result = await runtime.reportServerManager.stopWorkspaceReportServer(workspace);
    if (!result.stopped) {
        console.log(`UsbUiTest report server is not running for ${workspace.rootDir}`);
        return;
    }
    console.log(`Stopped UsbUiTest report server for ${workspace.rootDir}`);
}
async function printWorkspaceReportServerStatus(workspacePath) {
    const runtime = await (0, localRuntime_js_1.resolveLocalRuntime)();
    const workspace = await resolveCommandWorkspace(workspacePath);
    const status = await runtime.reportServerManager.getWorkspaceReportServerStatus(workspace);
    if (!status.running || !status.state) {
        console.log(`UsbUiTest report server is not running for ${workspace.rootDir}`);
        return;
    }
    console.log('UsbUiTest report server status');
    console.log(`Workspace root: ${workspace.rootDir}`);
    console.log(`URL: ${status.state.url}`);
    console.log(`PID: ${status.state.pid}`);
    console.log(`Port: ${status.state.port}`);
    console.log(`Mode: ${status.state.mode}`);
    console.log(`Started at: ${status.state.startedAt}`);
    console.log(`Healthy: ${status.healthy ? 'yes' : 'no'}`);
}
async function resolveCommandWorkspace(workspacePath, output = process.stdout) {
    return (0, workspace_js_1.resolveWorkspaceForCommand)({
        workspacePath,
        io: {
            input: process.stdin,
            output,
            isTTY: Boolean(process.stdin.isTTY && output.isTTY),
        },
    });
}
function parsePortOption(value, fallback) {
    const normalized = value.trim();
    if (normalized.length === 0) {
        return fallback;
    }
    if (!/^\d+$/.test(normalized)) {
        throw new Error(`Invalid --port value "${value}". Expected an integer between 0 and 65535.`);
    }
    const parsed = Number(normalized);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(`Invalid --port value "${value}". Expected an integer between 0 and 65535.`);
    }
    return parsed;
}
async function tryStartReportServer(workspace, runtime) {
    try {
        const server = await runtime.reportServerManager.startOrReuseWorkspaceReportServer({
            workspace,
            requestedPort: 4173,
            dev: false,
        });
        console.log(`Report server: ${runtime.reportServerManager.buildWorkspaceReportUrl(server.url)}`);
        return server.url;
    }
    catch {
        return undefined;
    }
}
function printSuccessSummary(result, runUrl) {
    console.log('\n' + '═'.repeat(60));
    console.log(`\x1b[32m✓ All tests passed\x1b[0m`);
    console.log('═'.repeat(60));
    console.log(`  Artifacts: ${result.runDir}`);
    if (runUrl) {
        console.log(`  Report:    ${runUrl}`);
    }
    console.log('═'.repeat(60));
}
function printFailureSummary(result, runUrl) {
    const failed = result.testResults.filter((t) => !t.success);
    const passed = result.testResults.filter((t) => t.success);
    console.log('\n' + '═'.repeat(60));
    if (result.status === 'aborted') {
        console.log(`\x1b[33m! Run aborted\x1b[0m`);
    }
    else {
        console.log(`\x1b[31m✗ ${failed.length} of ${result.testResults.length} test(s) failed\x1b[0m`);
    }
    console.log('═'.repeat(60));
    for (const test of failed) {
        console.log(`\n\x1b[31m✗ FAILED:\x1b[0m ${test.testName} (${test.relativePath})`);
        console.log(`  Message: ${test.message}`);
        printTestArtifactPaths(test, result.runDir);
    }
    if (passed.length > 0) {
        console.log(`\n\x1b[32m✓ PASSED:\x1b[0m ${passed.map((t) => t.testName).join(', ')}`);
    }
    console.log('\n' + '─'.repeat(60));
    console.log('Run artifacts:');
    console.log(`  Run directory:  ${result.runDir}`);
    console.log(`  Runner log:     ${result.runDir}/runner.log`);
    if (runUrl) {
        console.log(`  Report:         ${runUrl}`);
    }
    console.log('─'.repeat(60));
}
function printTestArtifactPaths(test, runDir) {
    const testDir = `${runDir}/tests/${test.testId}`;
    console.log(`  Result:      ${testDir}/result.json`);
    if (test.steps.length > 0) {
        console.log(`  Actions:     ${testDir}/actions/`);
        console.log(`  Screenshots: ${testDir}/screenshots/`);
    }
    if (test.recordingFile) {
        console.log(`  Recording:   ${runDir}/${test.recordingFile}`);
    }
    if (test.deviceLogFile) {
        console.log(`  Device log:  ${runDir}/${test.deviceLogFile}`);
    }
}
async function openUrlBestEffort(url, runtime) {
    try {
        const resolved = runtime ?? await (0, localRuntime_js_1.resolveLocalRuntime)();
        await resolved.reportServerManager.openReportUrl(url);
    }
    catch {
        // Silently ignore — the URL is already printed to the terminal.
    }
}
async function exitWithRawStderr(message, exitCode) {
    const rendered = message.endsWith('\n') ? message : `${message}\n`;
    await new Promise((resolve, reject) => {
        process.stderr.write(rendered, (writeError) => {
            if (writeError) {
                reject(writeError);
                return;
            }
            resolve();
        });
    });
    process.exit(exitCode);
}
//# sourceMappingURL=usb-ui-test.js.map