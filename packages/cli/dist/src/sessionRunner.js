"use strict";
// Orchestrates: detect device -> set up -> execute test.
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSessionDeps = exports.DevicePreparationError = void 0;
exports.isDevicePreparationError = isDevicePreparationError;
exports.prepareTestSession = prepareTestSession;
exports.executeTestOnSession = executeTestOnSession;
exports.runGoal = runGoal;
const common_1 = require("@usb-ui-test/common");
const device_node_1 = require("@usb-ui-test/device-node");
const goal_executor_1 = require("@usb-ui-test/goal-executor");
const local_executor_1 = require("@usb-ui-test/local-executor");
const filePathUtil_js_1 = require("./filePathUtil.js");
const deviceInventoryPresenter_js_1 = require("./deviceInventoryPresenter.js");
const terminalRenderer_js_1 = require("./terminalRenderer.js");
class DevicePreparationError extends Error {
    diagnostics;
    constructor(message, diagnostics = []) {
        super(message);
        this.name = 'DevicePreparationError';
        this.diagnostics = diagnostics;
    }
}
exports.DevicePreparationError = DevicePreparationError;
function isDevicePreparationError(error) {
    return error instanceof DevicePreparationError;
}
exports.testSessionDeps = {
    createFilePathUtil: () => new filePathUtil_js_1.CliFilePathUtil(undefined, undefined, { downloadAssets: true }),
    getDeviceNode: () => device_node_1.DeviceNode.getInstance(),
    createSelectionIO: () => ({
        input: process.stdin,
        output: process.stdout,
        isTTY: process.stdin.isTTY === true && process.stdout.isTTY === true,
    }),
    createAiAgent: (params) => new goal_executor_1.AIAgent(params),
    createExecutor: (params) => new goal_executor_1.TestExecutor(params),
    createRenderer: () => new terminalRenderer_js_1.TerminalRenderer(),
};
async function prepareTestSession(config, dependencies = exports.testSessionDeps) {
    const filePathUtil = dependencies.createFilePathUtil();
    common_1.Logger.i('Detecting local devices...');
    const adbPath = await filePathUtil.getADBPath();
    const deviceNode = dependencies.getDeviceNode();
    const selectionIO = dependencies.createSelectionIO();
    deviceNode.init(filePathUtil);
    let cleanedUp = false;
    const cleanup = async () => {
        if (cleanedUp) {
            return;
        }
        cleanedUp = true;
        await deviceNode.cleanup();
    };
    try {
        let inventory = await deviceNode.detectInventory(adbPath);
        let scopedEntries = filterInventoryEntries(inventory.entries, config.platform);
        let scopedDiagnostics = filterInventoryDiagnostics(inventory.diagnostics, config.platform);
        const selectableEntries = getSelectableEntries(scopedEntries);
        if (selectableEntries.length === 1) {
            common_1.Logger.i(buildAutoSelectionSummary(scopedEntries, selectableEntries[0]));
        }
        else if (selectableEntries.length === 0) {
            (0, deviceInventoryPresenter_js_1.printInventorySummary)({
                heading: 'Detected local targets',
                entries: scopedEntries,
                selectableEntries,
                output: selectionIO.output,
            });
        }
        let selectedEntry = await chooseInventoryEntry({
            entries: scopedEntries,
            diagnostics: scopedDiagnostics,
            requestedPlatform: config.platform,
            selectionIO,
        });
        if (selectedEntry.startable) {
            common_1.Logger.i(`Starting device: ${selectedEntry.displayName}`);
            common_1.Logger.i('Waiting for the selected device to become ready...');
            const startupDiagnostic = await deviceNode.startTarget(selectedEntry, adbPath);
            if (startupDiagnostic) {
                (0, deviceInventoryPresenter_js_1.printDiagnosticsFailure)({
                    heading: 'Device startup failed',
                    diagnostics: [startupDiagnostic],
                    output: selectionIO.output,
                });
                throw new DevicePreparationError(startupDiagnostic.summary, [startupDiagnostic]);
            }
            inventory = await deviceNode.detectInventory(adbPath);
            scopedEntries = filterInventoryEntries(inventory.entries, config.platform);
            scopedDiagnostics = filterInventoryDiagnostics(inventory.diagnostics, config.platform);
            const startedEntry = scopedEntries.find((entry) => entry.selectionId === selectedEntry.selectionId && entry.runnable) ?? null;
            if (!startedEntry?.deviceInfo) {
                if (scopedDiagnostics.length > 0) {
                    (0, deviceInventoryPresenter_js_1.printDiagnosticsFailure)({
                        heading: 'Device startup failed',
                        diagnostics: scopedDiagnostics,
                        output: selectionIO.output,
                    });
                }
                throw new DevicePreparationError('The selected device did not become runnable after startup.', scopedDiagnostics);
            }
            selectedEntry = startedEntry;
        }
        if (!selectedEntry?.deviceInfo) {
            throw new DevicePreparationError('No runnable device is available for this run.');
        }
        const deviceInfo = selectedEntry.deviceInfo;
        const platform = deviceInfo.isAndroid ? common_1.PLATFORM_ANDROID : 'ios';
        common_1.Logger.i(`Using device: ${selectedEntry.displayName}`);
        common_1.Logger.i('Setting up device...');
        const device = await deviceNode.setUpDevice(deviceInfo);
        common_1.Logger.i('Driver connected.');
        if (config.appOverridePath) {
            common_1.Logger.i(`Installing app override: ${config.appOverridePath}`);
            if (platform === common_1.PLATFORM_ANDROID) {
                if (!deviceInfo.id) {
                    throw new Error('Android device serial is required to install an app override.');
                }
                const installed = await deviceNode.installAndroidApp(adbPath, deviceInfo.id, config.appOverridePath);
                if (!installed) {
                    throw new Error(`Failed to install Android app override after driver connection: ${config.appOverridePath}`);
                }
            }
            else {
                if (!deviceInfo.id) {
                    throw new Error('iOS simulator ID is required to install an app override.');
                }
                const installed = await deviceNode.installIOSApp(deviceInfo.id, config.appOverridePath);
                if (!installed) {
                    throw new Error(`Failed to install iOS app override after driver connection: ${config.appOverridePath}`);
                }
            }
        }
        let launchSummary;
        if (config.app) {
            launchSummary = await ensureAppReady(device, config.app);
        }
        return {
            deviceNode,
            device,
            deviceInfo,
            platform,
            app: config.app,
            launchSummary,
            cleanup,
        };
    }
    catch (error) {
        try {
            await cleanup();
        }
        catch (cleanupError) {
            common_1.Logger.w('Failed to clean up device resources after setup failure:', cleanupError);
        }
        throw error;
    }
}
async function executeTestOnSession(session, config, dependencies = exports.testSessionDeps) {
    const renderer = dependencies.createRenderer();
    let abortListener;
    let activeRecording;
    let activeLogCapture;
    try {
        // Deterministic-mode early branch. When the loaded test used structured
        // commands (parser detected mode='deterministic'), run the local executor
        // and skip the AI agent + AI executor entirely. Recording/log-capture
        // integration for this path lands in a follow-up; for v1 the focus is on
        // making the structured-command flow usable end-to-end.
        if (config.mode === 'deterministic' && config.structuredSteps) {
            return runDeterministicTestOnSession(session, config, renderer);
        }
        // AI path requires a model. Provide a clear error here rather than letting
        // the provider client crash with a cryptic missing-key message.
        if (!config.defaults.provider) {
            throw new Error('--model is required for AI-mode tests. Use provider/model format, for example google/gemini-3-flash-preview. Supported providers: openai, google, anthropic.');
        }
        const aiAgent = dependencies.createAiAgent({
            apiKeys: config.apiKeys,
            defaults: config.defaults,
            features: config.features,
        });
        const executor = dependencies.createExecutor({
            goal: config.goal,
            platform: session.platform,
            maxIterations: config.maxIterations,
            agent: session.device,
            aiAgent,
            preContext: session.launchSummary,
            appIdentifier: session.app?.identifier,
            runtimeBindings: config.runtimeBindings,
        });
        if (config.abortSignal?.aborted) {
            const abortedResult = createAbortedTestResult(session.platform);
            renderer.printSummary(abortedResult);
            return abortedResult;
        }
        if (config.abortSignal) {
            abortListener = () => {
                executor.abort();
            };
            config.abortSignal.addEventListener('abort', abortListener);
        }
        const recordingRequired = config.recording !== undefined && session.platform === common_1.PLATFORM_ANDROID;
        if (config.recording) {
            const recordingResponse = await session.device.startRecording(new common_1.RecordingRequest({
                runId: config.recording.runId,
                testId: config.recording.testId,
                apiKey: config.apiKeys[config.defaults.provider] ?? '',
                outputFilePath: config.recording.outputFilePath,
            }));
            if (recordingResponse.success) {
                activeRecording = {
                    runId: config.recording.runId,
                    testId: config.recording.testId,
                    startedAt: typeof recordingResponse.data?.['startedAt'] === 'string'
                        ? recordingResponse.data['startedAt']
                        : new Date().toISOString(),
                    keepPartialOnFailure: config.recording.keepPartialOnFailure ?? false,
                };
                common_1.Logger.i(`Recording started for test ${config.recording.testId} at ${activeRecording.startedAt}`);
            }
            else {
                const message = `Unable to start recording for test ${config.recording.testId}: ` +
                    `${recordingResponse.message ?? 'unknown recording error'}`;
                if (recordingRequired) {
                    common_1.Logger.e(message);
                    const failureResult = createRecordingFailureResult({
                        platform: session.platform,
                        message: `Recording is required for Android runs. ${message}`,
                    });
                    renderer.printSummary(failureResult);
                    return failureResult;
                }
                common_1.Logger.w(message);
            }
        }
        if (config.deviceLog) {
            try {
                const logResponse = await session.device.startLogCapture({
                    runId: config.deviceLog.runId,
                    testId: config.deviceLog.testId,
                    appIdentifier: session.app?.identifier,
                });
                if (logResponse.success) {
                    activeLogCapture = {
                        runId: config.deviceLog.runId,
                        testId: config.deviceLog.testId,
                        startedAt: typeof logResponse.data?.['startedAt'] === 'string'
                            ? logResponse.data['startedAt']
                            : new Date().toISOString(),
                        keepPartialOnFailure: config.deviceLog.keepPartialOnFailure ?? false,
                    };
                    common_1.Logger.i(`Log capture started for test ${config.deviceLog.testId} at ${activeLogCapture.startedAt}`);
                }
                else {
                    common_1.Logger.w(`Unable to start log capture for test ${config.deviceLog.testId}: ` +
                        `${logResponse.message ?? 'unknown log capture error'}`);
                }
            }
            catch (error) {
                common_1.Logger.w('Failed to start device log capture:', error);
            }
        }
        // Execute!
        let result = await executor.executeGoal((event) => renderer.onProgress(event));
        let recording;
        if (activeRecording) {
            const stopResponse = await session.device.stopRecording(activeRecording.runId, activeRecording.testId);
            if (stopResponse.success) {
                const filePath = stopResponse.data?.['filePath'];
                if (typeof filePath === 'string') {
                    recording = {
                        filePath,
                        startedAt: typeof stopResponse.data?.['startedAt'] === 'string'
                            ? stopResponse.data['startedAt']
                            : activeRecording.startedAt,
                        completedAt: typeof stopResponse.data?.['completedAt'] === 'string'
                            ? stopResponse.data['completedAt']
                            : new Date().toISOString(),
                    };
                }
                else if (recordingRequired) {
                    const message = `Recording is required for Android runs. ` +
                        `Recording stopped for test ${activeRecording.testId} but no file path was returned.`;
                    common_1.Logger.e(message);
                    result = markGoalResultFailed(result, message);
                }
                else {
                    common_1.Logger.w(`Recording stopped for test ${activeRecording.testId} but no file path was returned.`);
                }
            }
            else {
                const message = `Unable to stop recording for test ${activeRecording.testId}: ` +
                    `${stopResponse.message ?? 'unknown recording error'}`;
                try {
                    await session.device.abortRecording(activeRecording.runId, activeRecording.keepPartialOnFailure);
                }
                catch (error) {
                    common_1.Logger.w('Failed to finalize recording after stop failure:', error);
                }
                if (recordingRequired) {
                    common_1.Logger.e(message);
                    result = markGoalResultFailed(result, `Recording is required for Android runs. ${message}`);
                }
                else {
                    common_1.Logger.w(message);
                }
            }
            activeRecording = undefined;
        }
        let deviceLog;
        if (activeLogCapture) {
            try {
                const stopLogResponse = await session.device.stopLogCapture(activeLogCapture.runId, activeLogCapture.testId);
                if (stopLogResponse.success) {
                    const filePath = stopLogResponse.data?.['filePath'];
                    if (typeof filePath === 'string') {
                        deviceLog = {
                            filePath,
                            startedAt: typeof stopLogResponse.data?.['startedAt'] === 'string'
                                ? stopLogResponse.data['startedAt']
                                : activeLogCapture.startedAt,
                            completedAt: typeof stopLogResponse.data?.['completedAt'] === 'string'
                                ? stopLogResponse.data['completedAt']
                                : new Date().toISOString(),
                        };
                    }
                    else {
                        common_1.Logger.w(`Log capture stopped for test ${activeLogCapture.testId} but no file path was returned.`);
                    }
                    activeLogCapture = undefined;
                }
                else {
                    common_1.Logger.w(`Unable to stop log capture for test ${activeLogCapture.testId}: ` +
                        `${stopLogResponse.message ?? 'unknown log capture error'}`);
                    try {
                        await session.device.abortLogCapture(activeLogCapture.runId, activeLogCapture.keepPartialOnFailure);
                    }
                    catch (error) {
                        common_1.Logger.w('Failed to finalize log capture after stop failure:', error);
                    }
                    activeLogCapture = undefined;
                }
            }
            catch (error) {
                common_1.Logger.w('Failed to stop device log capture:', error);
                // Do NOT clear activeLogCapture here — let the finally block abort it
            }
        }
        const finalResult = recording
            ? { ...result, recording, ...(deviceLog ? { deviceLog } : {}) }
            : deviceLog
                ? { ...result, deviceLog }
                : result;
        // Print summary
        renderer.printSummary(finalResult);
        return finalResult;
    }
    finally {
        if (abortListener && config.abortSignal) {
            config.abortSignal.removeEventListener('abort', abortListener);
        }
        if (activeRecording) {
            try {
                await session.device.abortRecording(activeRecording.runId, activeRecording.keepPartialOnFailure);
            }
            catch (error) {
                common_1.Logger.w('Failed to abort active recording during cleanup:', error);
            }
        }
        if (activeLogCapture) {
            try {
                await session.device.abortLogCapture(activeLogCapture.runId, activeLogCapture.keepPartialOnFailure);
            }
            catch (error) {
                common_1.Logger.w('Failed to abort active log capture during cleanup:', error);
            }
        }
        renderer.destroy();
    }
}
/**
 * Top-level orchestrator for running a goal from the CLI.
 *
 */
async function runGoal(config, dependencies = exports.testSessionDeps) {
    printRunBanner(config);
    const session = await prepareTestSession({
        platform: config.platform,
        appOverridePath: config.appOverridePath,
        app: config.app,
    }, dependencies);
    try {
        return await executeTestOnSession(session, config, dependencies);
    }
    finally {
        try {
            await session.cleanup();
        }
        catch (error) {
            common_1.Logger.w('Failed to clean up device resources:', error);
        }
    }
}
async function ensureAppReady(device, app) {
    const appListResponse = await device.executeAction(new common_1.DeviceActionRequest({
        requestId: `prelaunch-app-list-${app.platform}`,
        action: new common_1.GetAppListAction(),
        timeout: 10,
    }));
    if (!appListResponse.success) {
        throw new Error(`Failed to inspect installed apps before launching ${formatAppReference(app)}: ${appListResponse.message ?? 'unknown app list error'}`);
    }
    const installedApps = (appListResponse.data?.['apps'] ?? []);
    const isInstalled = installedApps.some((installedApp) => installedApp.packageName === app.identifier);
    if (!isInstalled) {
        throw new Error(`${formatAppReference(app)} is not installed on the selected device. Pass --app <path> to install it or install it manually before running UsbUiTest.`);
    }
    common_1.Logger.i(`Prelaunching ${formatAppReference(app)}...`);
    const launchResponse = await device.executeAction(new common_1.DeviceActionRequest({
        requestId: `prelaunch-launch-${app.platform}`,
        action: new common_1.LaunchAppAction({
            appUpload: new common_1.AppUpload({
                id: '',
                platform: app.platform,
                packageName: app.identifier,
            }),
            allowAllPermissions: true,
            shouldUninstallBeforeLaunch: false,
            clearState: false,
            stopAppBeforeLaunch: false,
        }),
        timeout: 30,
    }));
    if (!launchResponse.success) {
        throw new Error(`Failed to launch ${formatAppReference(app)} before execution: ${launchResponse.message ?? 'unknown launch error'}`);
    }
    return [
        `The CLI already launched ${formatAppReference(app)} before the goal started.`,
        launchResponse.message ? `Driver response: ${launchResponse.message}` : undefined,
    ]
        .filter((line) => Boolean(line))
        .join(' ');
}
function formatAppReference(app) {
    return app.platform === common_1.PLATFORM_ANDROID
        ? `Android package "${app.identifier}"`
        : `iOS bundle ID "${app.identifier}"`;
}
function createRecordingFailureResult(params) {
    const timestamp = new Date().toISOString();
    return {
        success: false,
        status: 'failure',
        message: params.message,
        platform: params.platform,
        startedAt: timestamp,
        completedAt: timestamp,
        steps: [],
        totalIterations: 0,
    };
}
function createAbortedTestResult(platform) {
    const timestamp = new Date().toISOString();
    return {
        success: false,
        status: 'aborted',
        message: 'Goal execution was aborted',
        platform,
        startedAt: timestamp,
        completedAt: timestamp,
        steps: [],
        totalIterations: 0,
    };
}
function markGoalResultFailed(result, message) {
    return {
        ...result,
        success: false,
        status: result.status === 'aborted' ? 'aborted' : 'failure',
        message: result.success ? message : `${result.message}\n${message}`,
    };
}
function printRunBanner(config) {
    console.log('\n\x1b[1mUsbUiTest CLI\x1b[0m');
    console.log('─'.repeat(50));
    console.log(`Goal: ${config.goal}`);
    const defaultReasoning = config.defaults.reasoning ? ` (${config.defaults.reasoning})` : '';
    console.log(`Model: ${config.defaults.provider}/${config.defaults.modelName}${defaultReasoning}`);
    if (config.features) {
        const overrides = Object.entries(config.features)
            .filter(([, override]) => override && (override.model || override.reasoning))
            .map(([feature, override]) => {
            const parts = [];
            if (override.model)
                parts.push(override.model);
            if (override.reasoning)
                parts.push(override.reasoning);
            return `  ${feature}: ${parts.join(' ')}`;
        });
        if (overrides.length > 0) {
            console.log('Feature overrides:');
            for (const line of overrides)
                console.log(line);
        }
    }
    console.log('─'.repeat(50) + '\n');
}
async function chooseInventoryEntry(params) {
    const selectableEntries = getSelectableEntries(params.entries);
    if (selectableEntries.length === 1) {
        return selectableEntries[0];
    }
    const runnableEntries = params.entries.filter((entry) => entry.runnable);
    if (runnableEntries.length > 1) {
        return await (0, deviceInventoryPresenter_js_1.promptForDeviceSelection)({
            heading: 'Select a device',
            entries: params.entries,
            selectableEntries: runnableEntries,
            io: params.selectionIO,
        });
    }
    const startableEntries = params.entries.filter((entry) => entry.startable);
    if (startableEntries.length > 1) {
        return await (0, deviceInventoryPresenter_js_1.promptForDeviceSelection)({
            heading: 'Select a device to start',
            entries: params.entries,
            selectableEntries: startableEntries,
            io: params.selectionIO,
        });
    }
    if (params.diagnostics.length > 0) {
        (0, deviceInventoryPresenter_js_1.printDiagnosticsFailure)({
            heading: 'Device discovery failed',
            diagnostics: params.diagnostics,
            output: params.selectionIO.output,
        });
    }
    throw new DevicePreparationError(buildNoUsableTargetMessage(params.requestedPlatform), params.diagnostics);
}
function getSelectableEntries(entries) {
    const runnableEntries = entries.filter((entry) => entry.runnable);
    if (runnableEntries.length > 0) {
        return runnableEntries;
    }
    return entries.filter((entry) => entry.startable);
}
function filterInventoryEntries(entries, requestedPlatform) {
    if (!requestedPlatform) {
        return entries;
    }
    const normalizedPlatform = requestedPlatform.toLowerCase();
    return entries.filter((entry) => entry.platform === normalizedPlatform);
}
function filterInventoryDiagnostics(diagnostics, requestedPlatform) {
    if (!requestedPlatform) {
        return diagnostics;
    }
    const normalizedPlatform = requestedPlatform.toLowerCase();
    if (normalizedPlatform === common_1.PLATFORM_ANDROID) {
        return diagnostics.filter((diagnostic) => diagnostic.scope === 'android-connected' ||
            diagnostic.scope === 'android-targets' ||
            diagnostic.scope === 'startup');
    }
    if (normalizedPlatform === 'ios') {
        return diagnostics.filter((diagnostic) => diagnostic.scope === 'ios-simulators' ||
            diagnostic.scope === 'startup');
    }
    return diagnostics;
}
function buildNoUsableTargetMessage(requestedPlatform) {
    if (requestedPlatform) {
        return `No runnable ${requestedPlatform.toLowerCase()} devices or startable targets were found.`;
    }
    return 'No runnable devices or startable targets were found.';
}
function buildAutoSelectionSummary(entries, selectedEntry) {
    const totalTargets = entries.length;
    const androidCount = entries.filter((entry) => entry.platform === common_1.PLATFORM_ANDROID).length;
    const iosCount = entries.filter((entry) => entry.platform === 'ios').length;
    const platformCounts = [
        androidCount > 0 ? `${androidCount} Android` : null,
        iosCount > 0 ? `${iosCount} iOS` : null,
    ].filter((value) => value !== null);
    const platformSummary = platformCounts.length > 0 ? ` (${platformCounts.join(', ')})` : '';
    const targetKind = selectedEntry.runnable ? 'ready target' : 'startable target';
    return (`Detected ${totalTargets} target${totalTargets === 1 ? '' : 's'}${platformSummary}; ` +
        `1 ${targetKind}: ${selectedEntry.displayName}`);
}
// ---------------------------------------------------------------------------
// Deterministic-mode runner
// ---------------------------------------------------------------------------
//
// When TestDefinition.mode === 'deterministic', we bypass the AI executor and
// run the parsed structured commands locally via @usb-ui-test/local-executor.
// The result is shaped to match TestExecutionResult so downstream consumers
// (terminal renderer, report writer, run manifest) work unchanged.
//
// v1 limitation: recording / device-log capture lifecycle is not yet wired
// for the deterministic path. The session still respects --platform, app
// identity, abort signals, and the renderer's progress events.
async function runDeterministicTestOnSession(session, config, renderer) {
    const startedAt = new Date().toISOString();
    const steps = [];
    if (!config.structuredSteps || config.structuredSteps.length === 0) {
        const completedAt = new Date().toISOString();
        const result = {
            success: false,
            status: 'failure',
            message: 'Deterministic mode selected but structuredSteps is empty',
            platform: session.platform,
            startedAt,
            completedAt,
            steps: [],
            totalIterations: 0,
        };
        renderer.printSummary(result);
        return result;
    }
    // The deterministic executor talks directly to the driver via
    // CommonDriverActions. The session's .device handle is a thin wrapper
    // around the same gRPC client, so we can construct CommonDriverActions
    // from its underlying transport.
    const driver = createDriverFromSession(session);
    if (!driver) {
        const completedAt = new Date().toISOString();
        const result = {
            success: false,
            status: 'failure',
            message: 'Deterministic mode requires a CommonDriverActions-compatible device handle, ' +
                'but the active session does not expose one.',
            platform: session.platform,
            startedAt,
            completedAt,
            steps: [],
            totalIterations: 0,
        };
        renderer.printSummary(result);
        return result;
    }
    const appContext = {
        platform: session.platform,
        // ResolvedAppConfig exposes a single `identifier` field whose meaning
        // (packageName vs bundleId) is encoded by `identifierKind`. Either way,
        // the Android/iOS drivers want the identifier string.
        packageName: session.app?.identifier ?? '',
    };
    const executor = new local_executor_1.DeterministicExecutor({
        driver,
        appContext,
        steps: config.structuredSteps,
        onProgress: async (event) => {
            if (event.type === 'step_start') {
                await renderer.onProgress({
                    type: 'executing',
                    iteration: event.index + 1,
                    totalIterations: config.structuredSteps?.length ?? 0,
                    action: event.step.kind,
                    reason: '',
                });
            }
            else if (event.type === 'step_complete') {
                steps.push({
                    iteration: event.index + 1,
                    action: event.result.step.kind,
                    reason: '',
                    naturalLanguageAction: event.result.step.kind,
                    success: event.result.success,
                    ...(event.result.errorMessage
                        ? { errorMessage: event.result.errorMessage }
                        : {}),
                    timestamp: new Date().toISOString(),
                    durationMs: event.result.durationMs,
                });
            }
        },
    });
    if (config.abortSignal?.aborted) {
        const aborted = createAbortedTestResult(session.platform);
        renderer.printSummary(aborted);
        return aborted;
    }
    const runResult = await executor.run();
    const completedAt = new Date().toISOString();
    const finalStatus = runResult.success
        ? 'success'
        : 'failure';
    const message = runResult.success
        ? 'Deterministic test passed'
        : runResult.steps[runResult.failedAtIndex ?? 0]?.errorMessage ??
            'Deterministic test failed';
    const finalResult = {
        success: runResult.success,
        status: finalStatus,
        message,
        platform: session.platform,
        startedAt,
        completedAt,
        steps: steps,
        totalIterations: steps.length,
    };
    renderer.printSummary(finalResult);
    return finalResult;
}
/**
 * Try to produce a CommonDriverActions instance from the session's device
 * handle. Returns null if the active device shape doesn't expose one — that
 * shouldn't happen in production but the early-branch guards avoid crashing
 * on misconfigured test fakes.
 */
function createDriverFromSession(session) {
    // The platform device classes (AndroidDevice, IOSSimulator) — and
    // CommonDriverActions itself — all satisfy DriverHandle structurally:
    // tap, enterText, scrollAbs, launchApp, getScreenshotAndHierarchy. We
    // duck-type on that surface rather than depending on a specific class.
    const device = session.device;
    if (typeof device.tap === 'function' &&
        typeof device.enterText === 'function' &&
        typeof device.scrollAbs === 'function' &&
        typeof device.launchApp === 'function' &&
        typeof device.getScreenshotAndHierarchy === 'function') {
        return device;
    }
    return null;
}
//# sourceMappingURL=sessionRunner.js.map