"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const sessionRunner_js_1 = require("./sessionRunner.js");
function createAndroidTestExecutionResult() {
    return {
        success: true,
        status: 'success',
        message: 'Goal completed successfully.',
        platform: common_1.PLATFORM_ANDROID,
        startedAt: '2026-03-20T10:00:00.000Z',
        completedAt: '2026-03-20T10:00:05.000Z',
        steps: [],
        totalIterations: 1,
    };
}
function createAndroidDeviceInfo() {
    return new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'emulator-5554',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    });
}
function createIOSDeviceInfo() {
    return new common_1.DeviceInfo({
        id: 'BOOTED-DEVICE-1',
        deviceUUID: 'BOOTED-DEVICE-1',
        isAndroid: false,
        sdkVersion: 17,
        name: 'iPhone 15 Pro',
    });
}
function createInventoryEntryFromDevice(deviceInfo) {
    const platform = deviceInfo.isAndroid ? 'android' : 'ios';
    const targetKind = deviceInfo.isAndroid ? 'android-emulator' : 'ios-simulator';
    const state = deviceInfo.isAndroid ? 'connected' : 'booted';
    return {
        selectionId: `${platform}:${deviceInfo.id}`,
        platform,
        targetKind,
        state,
        stateDetail: null,
        runnable: true,
        startable: false,
        displayName: `${deviceInfo.name ?? deviceInfo.id} - ${deviceInfo.id}`,
        rawId: deviceInfo.id ?? deviceInfo.deviceUUID,
        modelName: deviceInfo.name,
        osVersionLabel: deviceInfo.isAndroid ? 'Android 14' : 'iOS 17.5',
        deviceInfo,
        transcripts: [],
    };
}
function createStartableIOSEntry() {
    return {
        selectionId: 'ios-simulator:SHUTDOWN-DEVICE-1',
        platform: 'ios',
        targetKind: 'ios-simulator',
        state: 'shutdown',
        stateDetail: null,
        runnable: false,
        startable: true,
        displayName: 'iPhone 15 - iOS 17.5 - SHUTDOWN-DEVICE-1',
        rawId: 'SHUTDOWN-DEVICE-1',
        modelName: 'iPhone 15',
        osVersionLabel: 'iOS 17.5',
        deviceInfo: null,
        transcripts: [],
    };
}
function createDependencies(params) {
    const printedResults = [];
    const selectionInput = new node_stream_1.PassThrough();
    if (params.selectionInput) {
        selectionInput.end(params.selectionInput);
    }
    const selectionOutput = new node_stream_1.PassThrough();
    let selectionOutputText = '';
    selectionOutput.on('data', (chunk) => {
        selectionOutputText += String(chunk);
    });
    let inventoryCallCount = 0;
    const device = {
        async executeAction(request) {
            if (params.onExecuteDeviceAction) {
                return await params.onExecuteDeviceAction(request);
            }
            if (request.action instanceof common_1.GetAppListAction) {
                return new common_1.DeviceNodeResponse({
                    success: true,
                    data: {
                        apps: params.availableApps ?? [],
                    },
                });
            }
            params.deviceActions?.push(request.action);
            if (request.action instanceof common_1.LaunchAppAction) {
                return new common_1.DeviceNodeResponse({
                    success: true,
                    message: `Launched ${request.action.appUpload.packageName}`,
                });
            }
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async startRecording(request) {
            return await (params.startRecording ??
                (async () => new common_1.DeviceNodeResponse({
                    success: true,
                    data: {
                        startedAt: '2026-03-20T10:00:00.000Z',
                    },
                })))(request);
        },
        async stopRecording(runId, testId) {
            return await (params.stopRecording ??
                (async () => new common_1.DeviceNodeResponse({
                    success: true,
                    data: {
                        filePath: '/tmp/run_case.mp4',
                        startedAt: '2026-03-20T10:00:00.000Z',
                        completedAt: '2026-03-20T10:00:05.000Z',
                    },
                })))(runId, testId);
        },
        async abortRecording(runId, keepOutput) {
            await (params.abortRecording ?? (async () => { }))(runId, keepOutput);
        },
    };
    const deviceNode = {
        async installAndroidApp(adbPath, deviceId, appPath) {
            return await (params.onInstallAndroidApp ??
                (async () => true))(adbPath, deviceId, appPath);
        },
        async installIOSApp(deviceId, appPath) {
            return await (params.onInstallIOSApp ?? (async () => true))(deviceId, appPath);
        },
        init() {
            params.onInit?.();
        },
        async detectInventory() {
            params.onDetectDevices?.();
            const defaultReport = {
                entries: (params.devices ?? [createAndroidDeviceInfo()]).map(createInventoryEntryFromDevice),
                diagnostics: [],
            };
            const nextReport = params.inventoryReports?.[inventoryCallCount] ??
                params.inventoryReports?.[params.inventoryReports.length - 1] ??
                defaultReport;
            inventoryCallCount += 1;
            return nextReport;
        },
        async startTarget(entry, adbPath) {
            return await (params.onStartTarget ?? (async () => null))(entry, adbPath);
        },
        async setUpDevice() {
            params.onSetUpDevice?.();
            return device;
        },
        async cleanup() {
            await params.onCleanup?.();
        },
    };
    const dependencies = {
        createFilePathUtil: () => ({
            async getADBPath() {
                return params.adbPath ?? '/usr/bin/adb';
            },
        }),
        getDeviceNode: () => deviceNode,
        createSelectionIO: () => ({
            input: selectionInput,
            output: selectionOutput,
            isTTY: true,
        }),
        createAiAgent: () => ({}),
        createExecutor: () => ({
            abort() { },
            async executeGoal() {
                return await (params.executeGoal ?? (async () => createAndroidTestExecutionResult()))();
            },
        }),
        createRenderer: () => ({
            onProgress() { },
            printSummary(result) {
                printedResults.push(result);
            },
            destroy() { },
        }),
    };
    Object.assign(dependencies, {
        __printedResults: printedResults,
        __selectionOutputText: () => selectionOutputText,
    });
    return dependencies;
}
(0, node_test_1.default)('runGoal starts and stops Android recording when recording is configured', async () => {
    const recordingRequests = [];
    const stopCalls = [];
    const dependencies = createDependencies({
        async startRecording(request) {
            recordingRequests.push(request);
            return new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    startedAt: '2026-03-20T10:00:00.000Z',
                },
            });
        },
        async stopRecording(runId, testId) {
            stopCalls.push([runId, testId]);
            return new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    filePath: '/tmp/run_case.mp4',
                    startedAt: '2026-03-20T10:00:00.000Z',
                    completedAt: '2026-03-20T10:00:05.000Z',
                },
            });
        },
    });
    const result = await (0, sessionRunner_js_1.runGoal)({
        goal: 'Log in',
        apiKeys: { openai: 'test-key' },
        defaults: { provider: 'openai', modelName: 'gpt-4.1' },
        platform: common_1.PLATFORM_ANDROID,
        recording: {
            runId: 'run-1',
            testId: 'case-1',
        },
    }, dependencies);
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(stopCalls, [['run-1', 'case-1']]);
    strict_1.default.equal(recordingRequests.length, 1);
    strict_1.default.equal(recordingRequests[0]?.runId, 'run-1');
    strict_1.default.equal(recordingRequests[0]?.testId, 'case-1');
    strict_1.default.equal(recordingRequests[0]?.outputFilePath, undefined);
    strict_1.default.equal(result.recording?.filePath, '/tmp/run_case.mp4');
});
(0, node_test_1.default)('executeTestOnSession forwards explicit recording output paths and preserves partials when execution aborts', async () => {
    const recordingRequests = [];
    const abortCalls = [];
    const dependencies = createDependencies({
        async startRecording(request) {
            recordingRequests.push(request);
            return new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    startedAt: '2026-03-20T10:00:00.000Z',
                },
            });
        },
        async abortRecording(runId, keepOutput) {
            abortCalls.push([runId, keepOutput]);
        },
        async executeGoal() {
            throw new Error('executor crashed');
        },
    });
    const session = await (0, sessionRunner_js_1.prepareTestSession)({
        platform: common_1.PLATFORM_ANDROID,
    }, dependencies);
    try {
        await strict_1.default.rejects(() => (0, sessionRunner_js_1.executeTestOnSession)(session, {
            goal: 'Test 1',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-4.1' },
            recording: {
                runId: 'run-1',
                testId: 'case-1',
                outputFilePath: '/tmp/usb-ui-test-artifacts/run-1/tests/case-1/recording.mp4',
                keepPartialOnFailure: true,
            },
        }, dependencies), /executor crashed/);
        strict_1.default.equal(recordingRequests[0]?.outputFilePath, '/tmp/usb-ui-test-artifacts/run-1/tests/case-1/recording.mp4');
        strict_1.default.deepEqual(abortCalls, [['run-1', true]]);
    }
    finally {
        await session.cleanup();
    }
});
(0, node_test_1.default)('prepareTestSession installs the Android app override once during shared setup', async () => {
    const installCalls = [];
    let detectCalls = 0;
    let setUpCalls = 0;
    let cleanupCalls = 0;
    const dependencies = createDependencies({
        onDetectDevices() {
            detectCalls += 1;
        },
        onSetUpDevice() {
            setUpCalls += 1;
        },
        async onCleanup() {
            cleanupCalls += 1;
        },
        async onInstallAndroidApp(adbPath, deviceId, appPath) {
            installCalls.push([adbPath, deviceId, appPath]);
            return true;
        },
    });
    const session = await (0, sessionRunner_js_1.prepareTestSession)({
        platform: common_1.PLATFORM_ANDROID,
        appOverridePath: '/tmp/app.apk',
    }, dependencies);
    try {
        strict_1.default.equal(session.platform, common_1.PLATFORM_ANDROID);
        strict_1.default.equal(detectCalls, 1);
        strict_1.default.equal(setUpCalls, 1);
        strict_1.default.deepEqual(installCalls, [['/usr/bin/adb', 'emulator-5554', '/tmp/app.apk']]);
    }
    finally {
        await session.cleanup();
        strict_1.default.equal(cleanupCalls, 1);
    }
});
(0, node_test_1.default)('prepareTestSession prelaunches the configured app and stores the launch summary', async () => {
    const deviceActions = [];
    const dependencies = createDependencies({
        availableApps: [
            { packageName: 'org.wikipedia', name: 'Wikipedia' },
        ],
        deviceActions,
    });
    const session = await (0, sessionRunner_js_1.prepareTestSession)({
        platform: common_1.PLATFORM_ANDROID,
        app: {
            platform: common_1.PLATFORM_ANDROID,
            identifier: 'org.wikipedia',
            identifierKind: 'packageName',
        },
    }, dependencies);
    try {
        strict_1.default.equal(session.app?.identifier, 'org.wikipedia');
        strict_1.default.match(session.launchSummary ?? '', /already launched Android package "org\.wikipedia" before the goal started/);
        strict_1.default.equal(deviceActions.length, 1);
        strict_1.default.ok(deviceActions[0] instanceof common_1.LaunchAppAction);
        strict_1.default.equal(deviceActions[0].shouldUninstallBeforeLaunch, false);
    }
    finally {
        await session.cleanup();
    }
});
(0, node_test_1.default)('prepareTestSession fails when the configured app is not installed', async () => {
    const dependencies = createDependencies({
        availableApps: [],
    });
    await strict_1.default.rejects(() => (0, sessionRunner_js_1.prepareTestSession)({
        platform: common_1.PLATFORM_ANDROID,
        app: {
            platform: common_1.PLATFORM_ANDROID,
            identifier: 'org.wikipedia',
            identifierKind: 'packageName',
        },
    }, dependencies), /Android package "org\.wikipedia" is not installed on the selected device/);
});
(0, node_test_1.default)('prepareTestSession logs a compact summary when one target is auto-selected', async () => {
    const androidEntry = createInventoryEntryFromDevice(createAndroidDeviceInfo());
    const shutdownEntry = createStartableIOSEntry();
    const dependencies = createDependencies({
        inventoryReports: [
            {
                entries: [androidEntry, shutdownEntry],
                diagnostics: [],
            },
        ],
    });
    const logMessages = [];
    const sink = (entry) => {
        logMessages.push(entry.renderedMessage);
    };
    common_1.Logger.addSink(sink);
    const session = await (0, sessionRunner_js_1.prepareTestSession)({}, dependencies);
    try {
        const output = dependencies.__selectionOutputText();
        strict_1.default.equal(output, '');
        strict_1.default.match(logMessages.join('\n'), /\[usb-ui-test\] Detected 2 targets \(1 Android, 1 iOS\); 1 ready target: Android Emulator - emulator-5554/);
    }
    finally {
        common_1.Logger.removeSink(sink);
        await session.cleanup();
    }
});
(0, node_test_1.default)('prepareTestSession prompts for a device when multiple runnable targets are available', async () => {
    const androidEntry = createInventoryEntryFromDevice(createAndroidDeviceInfo());
    const iosEntry = createInventoryEntryFromDevice(createIOSDeviceInfo());
    const dependencies = createDependencies({
        inventoryReports: [
            {
                entries: [androidEntry, iosEntry],
                diagnostics: [],
            },
        ],
        selectionInput: '2\n',
    });
    const session = await (0, sessionRunner_js_1.prepareTestSession)({}, dependencies);
    try {
        strict_1.default.equal(session.platform, 'ios');
        const output = dependencies.__selectionOutputText();
        strict_1.default.doesNotMatch(output, /Detected local targets/);
        strict_1.default.match(output, /Select a device/);
        strict_1.default.match(output, /Ready Targets/);
        strict_1.default.match(output, /\(connected\)/);
        strict_1.default.match(output, /\(booted\)/);
        strict_1.default.equal((output.match(/Ready Targets/g) ?? []).length, 1);
    }
    finally {
        await session.cleanup();
    }
});
(0, node_test_1.default)('prepareTestSession starts a selected shutdown simulator before setup', async () => {
    const shutdownEntry = createStartableIOSEntry();
    const bootedEntry = {
        selectionId: 'ios-simulator:SHUTDOWN-DEVICE-1',
        platform: 'ios',
        targetKind: 'ios-simulator',
        state: 'booted',
        stateDetail: null,
        runnable: true,
        startable: false,
        displayName: 'iPhone 15 - iOS 17.5 - SHUTDOWN-DEVICE-1',
        rawId: 'SHUTDOWN-DEVICE-1',
        modelName: 'iPhone 15',
        osVersionLabel: 'iOS 17.5',
        deviceInfo: new common_1.DeviceInfo({
            id: 'SHUTDOWN-DEVICE-1',
            deviceUUID: 'SHUTDOWN-DEVICE-1',
            isAndroid: false,
            sdkVersion: 17,
            name: 'iPhone 15',
        }),
        transcripts: [],
    };
    let startedTargets = 0;
    const dependencies = createDependencies({
        inventoryReports: [
            {
                entries: [shutdownEntry],
                diagnostics: [],
            },
            {
                entries: [bootedEntry],
                diagnostics: [],
            },
        ],
        async onStartTarget() {
            startedTargets += 1;
            return null;
        },
    });
    const session = await (0, sessionRunner_js_1.prepareTestSession)({}, dependencies);
    try {
        strict_1.default.equal(session.platform, 'ios');
        strict_1.default.equal(startedTargets, 1);
    }
    finally {
        await session.cleanup();
    }
});
(0, node_test_1.default)('prepareTestSession reports Android app override failure after driver connection', async () => {
    let cleanupCalls = 0;
    let setUpCalls = 0;
    const dependencies = createDependencies({
        onSetUpDevice() {
            setUpCalls += 1;
        },
        async onCleanup() {
            cleanupCalls += 1;
        },
        async onInstallAndroidApp() {
            return false;
        },
    });
    await strict_1.default.rejects(() => (0, sessionRunner_js_1.prepareTestSession)({
        platform: common_1.PLATFORM_ANDROID,
        appOverridePath: '/tmp/app.apk',
    }, dependencies), /Failed to install Android app override after driver connection: \/tmp\/app\.apk/);
    strict_1.default.equal(setUpCalls, 1);
    strict_1.default.equal(cleanupCalls, 1);
});
(0, node_test_1.default)('executeTestOnSession reuses one prepared session while keeping recording scoped per test', async () => {
    const recordingRequests = [];
    const stopCalls = [];
    let detectCalls = 0;
    let setUpCalls = 0;
    let cleanupCalls = 0;
    const dependencies = createDependencies({
        onDetectDevices() {
            detectCalls += 1;
        },
        onSetUpDevice() {
            setUpCalls += 1;
        },
        async onCleanup() {
            cleanupCalls += 1;
        },
        async startRecording(request) {
            recordingRequests.push(request);
            return new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    startedAt: '2026-03-20T10:00:00.000Z',
                },
            });
        },
        async stopRecording(runId, testId) {
            stopCalls.push([runId, testId]);
            return new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    filePath: `/tmp/${testId}.mp4`,
                    startedAt: '2026-03-20T10:00:00.000Z',
                    completedAt: '2026-03-20T10:00:05.000Z',
                },
            });
        },
    });
    const session = await (0, sessionRunner_js_1.prepareTestSession)({
        platform: common_1.PLATFORM_ANDROID,
    }, dependencies);
    try {
        await (0, sessionRunner_js_1.executeTestOnSession)(session, {
            goal: 'Test 1',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-4.1' },
            recording: {
                runId: 'run-1',
                testId: 'case-1',
            },
        }, dependencies);
        await (0, sessionRunner_js_1.executeTestOnSession)(session, {
            goal: 'Test 2',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-4.1' },
            recording: {
                runId: 'run-1',
                testId: 'case-2',
            },
        }, dependencies);
        strict_1.default.equal(detectCalls, 1);
        strict_1.default.equal(setUpCalls, 1);
        strict_1.default.deepEqual(recordingRequests.map((request) => request.testId), ['case-1', 'case-2']);
        strict_1.default.deepEqual(stopCalls, [
            ['run-1', 'case-1'],
            ['run-1', 'case-2'],
        ]);
    }
    finally {
        await session.cleanup();
        strict_1.default.equal(cleanupCalls, 1);
    }
});
(0, node_test_1.default)('executeTestOnSession forwards the prelaunch summary and app identifier to the executor', async () => {
    let capturedConfig;
    const dependencies = createDependencies({});
    dependencies.createExecutor = (params) => {
        capturedConfig = {
            preContext: params.preContext,
            appIdentifier: params.appIdentifier,
        };
        return {
            abort() { },
            async executeGoal() {
                return createAndroidTestExecutionResult();
            },
        };
    };
    const session = {
        platform: 'android',
        deviceInfo: {},
        deviceNode: {},
        device: {},
        app: {
            platform: 'android',
            identifier: 'org.wikipedia',
            identifierKind: 'packageName',
        },
        launchSummary: 'The CLI already launched Android package "org.wikipedia".',
        async cleanup() {
            return undefined;
        },
    };
    await (0, sessionRunner_js_1.executeTestOnSession)(session, {
        goal: 'Test 1',
        apiKeys: { openai: 'test-key' },
        defaults: { provider: 'openai', modelName: 'gpt-4.1' },
    }, dependencies);
    strict_1.default.deepEqual(capturedConfig, {
        preContext: 'The CLI already launched Android package "org.wikipedia".',
        appIdentifier: 'org.wikipedia',
    });
});
(0, node_test_1.default)('runGoal still performs isolated setup and cleanup for single-test execution', async () => {
    let detectCalls = 0;
    let setUpCalls = 0;
    let cleanupCalls = 0;
    const dependencies = createDependencies({
        onDetectDevices() {
            detectCalls += 1;
        },
        onSetUpDevice() {
            setUpCalls += 1;
        },
        async onCleanup() {
            cleanupCalls += 1;
        },
    });
    const result = await (0, sessionRunner_js_1.runGoal)({
        goal: 'Log in',
        apiKeys: { openai: 'test-key' },
        defaults: { provider: 'openai', modelName: 'gpt-4.1' },
        platform: common_1.PLATFORM_ANDROID,
    }, dependencies);
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(detectCalls, 1);
    strict_1.default.equal(setUpCalls, 1);
    strict_1.default.equal(cleanupCalls, 1);
});
(0, node_test_1.default)('runGoal fails before execution if required Android recording cannot start', async () => {
    let executed = false;
    const dependencies = createDependencies({
        async startRecording() {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'scrcpy not found in PATH',
            });
        },
        async executeGoal() {
            executed = true;
            return createAndroidTestExecutionResult();
        },
    });
    const result = await (0, sessionRunner_js_1.runGoal)({
        goal: 'Log in',
        apiKeys: { openai: 'test-key' },
        defaults: { provider: 'openai', modelName: 'gpt-4.1' },
        platform: common_1.PLATFORM_ANDROID,
        recording: {
            runId: 'run-1',
            testId: 'case-1',
        },
    }, dependencies);
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(executed, false);
    strict_1.default.match(result.message, /Recording is required for Android runs/);
});
(0, node_test_1.default)('runGoal marks the Android test as failed if recording stops without a video file', async () => {
    const abortCalls = [];
    const dependencies = createDependencies({
        async startRecording() {
            return new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    startedAt: '2026-03-20T10:00:00.000Z',
                },
            });
        },
        async stopRecording() {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'scrcpy process exited before file creation',
            });
        },
        async abortRecording(runId, keepOutput) {
            abortCalls.push([runId, keepOutput]);
        },
    });
    const result = await (0, sessionRunner_js_1.runGoal)({
        goal: 'Log in',
        apiKeys: { openai: 'test-key' },
        defaults: { provider: 'openai', modelName: 'gpt-4.1' },
        platform: common_1.PLATFORM_ANDROID,
        recording: {
            runId: 'run-1',
            testId: 'case-1',
        },
    }, dependencies);
    strict_1.default.equal(result.success, false);
    strict_1.default.match(result.message, /Recording is required for Android runs/);
    strict_1.default.deepEqual(abortCalls, [['run-1', false]]);
});
//# sourceMappingURL=goalRunner.test.js.map