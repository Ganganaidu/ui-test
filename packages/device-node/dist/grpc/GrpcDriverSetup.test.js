"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const GrpcDriverSetup_js_1 = require("./GrpcDriverSetup.js");
class FakeGrpcClient {
    channelCreations = [];
    pingResponses;
    captureResponses;
    updateAppIdsResponses;
    captureCalls = 0;
    updateAppIdsCalls = [];
    constructor(params) {
        this.pingResponses = params?.pingResponses ?? [true];
        this.captureResponses = params?.captureResponses ?? [];
        this.updateAppIdsResponses = params?.updateAppIdsResponses ?? [{ success: true }];
    }
    get isConnected() {
        return true;
    }
    createChannel(host, port) {
        this.channelCreations.push({ host, port });
    }
    async ping() {
        return this.pingResponses.shift() ?? false;
    }
    async getScreenshotAndHierarchy() {
        this.captureCalls += 1;
        const next = this.captureResponses.shift() ??
            new Error('No screenshot response configured');
        if (next instanceof Error) {
            throw next;
        }
        return next;
    }
    async updateAppIds(appIds) {
        this.updateAppIdsCalls.push(appIds);
        return this.updateAppIdsResponses.shift() ?? { success: true };
    }
    close() { }
}
class FakeIOSDriverProcess extends node_events_1.EventEmitter {
    stdout = new node_stream_1.PassThrough();
    stderr = new node_stream_1.PassThrough();
    pid = 4321;
    emitExit(code, signal = null) {
        this.emit('exit', code, signal);
    }
}
class FakeAndroidDriverProcess extends node_events_1.EventEmitter {
    stdout = new node_stream_1.PassThrough();
    stderr = new node_stream_1.PassThrough();
    pid = 9876;
    killed = false;
    kill(_signal) {
        this.killed = true;
        return true;
    }
    emitExit(code, signal = null) {
        this.emit('exit', code, signal);
    }
    emitError(error) {
        this.emit('error', error);
    }
}
function createFilePathUtil(overrides) {
    return {
        getADBPath: async () => '/usr/bin/adb',
        getDriverAppPath: async () => '/tmp/app-debug.apk',
        getDriverTestAppPath: async () => '/tmp/app-debug-androidTest.apk',
        getIOSDriverAppPath: async () => '/tmp/usb-ui-test-ios-test-Runner.app',
        getAppFilePath: async (appFileName) => appFileName,
        ensureIOSAppsAvailable: async () => undefined,
        ...overrides,
    };
}
// Android driver setup touches several AdbClient methods during cleanup,
// install, forward, and rollback. Tests that don't care about those calls can
// use this default fake and override just the methods they assert on.
function createAndroidAdbClientFake(overrides = {}) {
    return {
        async installApp() {
            return true;
        },
        async removePortForward() { },
        async forwardPort() {
            return 50051;
        },
        async forceStop() {
            return { success: true };
        },
        async clearAppData() {
            return { success: true };
        },
        async isProcessRunning() {
            return false;
        },
        ...overrides,
    };
}
(0, node_test_1.default)('GrpcDriverSetup waits for screenshot capture readiness after ping succeeds', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [true],
        captureResponses: [
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
            {
                success: true,
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        ],
    });
    const driverProcess = new FakeAndroidDriverProcess();
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake(),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        startAndroidDriverFn: () => driverProcess,
        captureReadinessTimeoutMs: 1000,
        captureReadinessDelayMs: 0,
    });
    const device = await setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    }));
    strict_1.default.equal(device.getDeviceInfo().id, 'emulator-5554');
    strict_1.default.equal(grpcClient.channelCreations.length, 1);
    strict_1.default.equal(grpcClient.captureCalls, 3);
});
(0, node_test_1.default)('GrpcDriverSetup fails when Android UiAutomation never becomes capture-ready after a retry', async () => {
    // prepare() now retries the driver start phase once when UiAutomation
    // never binds, so the final-failure path needs to survive both attempts.
    const transientCaptureResponse = {
        success: false,
        message: 'UiAutomation not connected',
        screenWidth: 0,
        screenHeight: 0,
    };
    const grpcClient = new FakeGrpcClient({
        pingResponses: [true, true],
        captureResponses: Array.from({ length: 40 }, () => ({
            ...transientCaptureResponse,
        })),
    });
    const driverProcesses = [new FakeAndroidDriverProcess(), new FakeAndroidDriverProcess()];
    let spawnCount = 0;
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake(),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        startAndroidDriverFn: () => {
            const next = driverProcesses[spawnCount] ?? new FakeAndroidDriverProcess();
            spawnCount += 1;
            return next;
        },
        captureReadinessTimeoutMs: 20,
        captureReadinessDelayMs: 5,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    })), /UiAutomation never became ready/);
    strict_1.default.equal(spawnCount, 2, 'expected one retry after capture-readiness failure');
    strict_1.default.equal(driverProcesses[0].killed, true, 'first driver should be killed before retry');
});
(0, node_test_1.default)('GrpcDriverSetup recovers when a stale UiAutomation binding clears after the one-shot retry', async () => {
    // Simulates the back-to-back-run failure: the first instrumentation attempt
    // connects over gRPC but never finishes binding UiAutomation. After the
    // inter-attempt teardown (force-stop + pm clear + pidof wait) the second
    // attempt succeeds. This is the core scenario the retry guard protects.
    const driverProcesses = [new FakeAndroidDriverProcess(), new FakeAndroidDriverProcess()];
    let spawnCount = 0;
    const adbCalls = [];
    // State-driven fake: the first spawned driver always replies "UiAutomation
    // not connected" (exhausting the readiness window), and the retry's driver
    // returns a successful capture on its first poll. This keeps the response
    // boundary tied to *attempt*, not to how many polls fit in a 20ms window.
    const grpcClient = {
        channelCreations: [],
        captureCalls: 0,
        get isConnected() {
            return true;
        },
        createChannel(host, port) {
            this.channelCreations.push({ host, port });
        },
        async ping() {
            return true;
        },
        async getScreenshotAndHierarchy() {
            this.captureCalls += 1;
            if (spawnCount <= 1) {
                return {
                    success: false,
                    message: 'UiAutomation not connected',
                    screenWidth: 0,
                    screenHeight: 0,
                };
            }
            return {
                success: true,
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            };
        },
        async updateAppIds() {
            return { success: true };
        },
        close() { },
    };
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake({
            async forceStop(...args) {
                const [, , packageName] = args;
                adbCalls.push(`forceStop:${packageName}`);
                return { success: true };
            },
            async clearAppData(...args) {
                const [, , packageName] = args;
                adbCalls.push(`clearAppData:${packageName}`);
                return { success: true };
            },
            async isProcessRunning(...args) {
                const [, , packageName] = args;
                adbCalls.push(`isProcessRunning:${packageName}`);
                return false;
            },
        }),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        startAndroidDriverFn: () => {
            const next = driverProcesses[spawnCount] ?? new FakeAndroidDriverProcess();
            spawnCount += 1;
            return next;
        },
        captureReadinessTimeoutMs: 20,
        captureReadinessDelayMs: 5,
    });
    const device = await setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    }));
    strict_1.default.equal(device.getDeviceInfo().id, 'emulator-5554');
    strict_1.default.equal(spawnCount, 2, 'expected exactly one retry');
    strict_1.default.equal(driverProcesses[0].killed, true, 'first driver should be SIGKILLed between attempts');
    strict_1.default.equal(driverProcesses[1].killed, false, 'second driver should remain alive after success');
    // The same force-stop + pm clear + pidof sequence must run twice — once for
    // pre-run cleanup, once between attempts — so a stale UiAutomation binding
    // from the first attempt is genuinely released before the retry spawns.
    strict_1.default.deepEqual(adbCalls, [
        'forceStop:app.usbuitest.android.test',
        'forceStop:app.usbuitest.android',
        'clearAppData:app.usbuitest.android.test',
        'isProcessRunning:app.usbuitest.android.test',
        'forceStop:app.usbuitest.android.test',
        'forceStop:app.usbuitest.android',
        'clearAppData:app.usbuitest.android.test',
        'isProcessRunning:app.usbuitest.android.test',
    ]);
});
(0, node_test_1.default)('GrpcDriverSetup does not retry when capture-readiness reports a non-transient failure', async () => {
    // "device offline" is not in TRANSIENT_CAPTURE_PATTERNS, so
    // waitForCaptureReadiness early-bails with {ready: false, transient: false}.
    // The retry is meant for the stale-UiAutomation (transient-but-window-expired)
    // case only — a non-transient failure must surface immediately without
    // burning an extra teardown + re-spawn cycle.
    const grpcClient = new FakeGrpcClient({
        pingResponses: [true],
        captureResponses: [
            { success: false, message: 'device offline', screenWidth: 0, screenHeight: 0 },
        ],
    });
    let spawnCount = 0;
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake(),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        startAndroidDriverFn: () => {
            spawnCount += 1;
            return new FakeAndroidDriverProcess();
        },
        captureReadinessTimeoutMs: 1000,
        captureReadinessDelayMs: 0,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    })), /non-transient failure.*device offline/);
    strict_1.default.equal(spawnCount, 1, 'non-transient failure must not trigger the one-shot retry');
});
(0, node_test_1.default)('GrpcDriverSetup aborts retry when the prior test-package process never disappears', async () => {
    // Inter-attempt teardown polls `pidof` to confirm the instrumentation host
    // is gone before spawning a second `am instrument`. If the poll times out,
    // the stale UiAutomation binding is likely still held — retrying would race
    // the exact condition the retry is meant to escape. The retry must bail and
    // surface the original capture-readiness error instead.
    const transientCaptureResponse = {
        success: false,
        message: 'UiAutomation not connected',
        screenWidth: 0,
        screenHeight: 0,
    };
    const grpcClient = new FakeGrpcClient({
        pingResponses: [true],
        captureResponses: Array.from({ length: 20 }, () => ({
            ...transientCaptureResponse,
        })),
    });
    let spawnCount = 0;
    const isProcessRunningCalls = [];
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake({
            async isProcessRunning(...args) {
                const [, , packageName] = args;
                isProcessRunningCalls.push(packageName);
                // The pre-run cleanup call (first invocation) sees a clean device.
                // Every subsequent call — the inter-attempt teardown poll — keeps
                // reporting the instrumentation host as alive, simulating a binding
                // that never releases within the cap.
                return isProcessRunningCalls.length > 1;
            },
        }),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        startAndroidDriverFn: () => {
            spawnCount += 1;
            return new FakeAndroidDriverProcess();
        },
        captureReadinessTimeoutMs: 20,
        captureReadinessDelayMs: 5,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    })), /UiAutomation never became ready/);
    strict_1.default.equal(spawnCount, 1, 'retry must not spawn a second driver when the prior one is still alive');
});
(0, node_test_1.default)('GrpcDriverSetup wires Android runtime scroll through adb', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [true],
        captureResponses: [
            {
                success: true,
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        ],
    });
    const driverProcess = new FakeAndroidDriverProcess();
    const swipeCalls = [];
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake({
            async swipe(...args) {
                const [adbPath, deviceSerial, params] = args;
                swipeCalls.push({ adbPath, deviceSerial, params });
                return { success: true, message: 'scrolled via adb' };
            },
        }),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        startAndroidDriverFn: () => driverProcess,
        captureReadinessTimeoutMs: 1000,
        captureReadinessDelayMs: 0,
    });
    const device = await setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    }));
    const response = await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-scroll-setup',
        action: new common_1.ScrollAbsAction({
            startX: 11,
            startY: 22,
            endX: 33,
            endY: 44,
            durationMs: 555,
        }),
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'scrolled via adb');
    strict_1.default.deepEqual(swipeCalls, [
        {
            adbPath: '/usr/bin/adb',
            deviceSerial: 'emulator-5554',
            params: {
                startX: 11,
                startY: 22,
                endX: 33,
                endY: 44,
                durationMs: 555,
            },
        },
    ]);
});
(0, node_test_1.default)('GrpcDriverSetup fails fast when the Android driver exits early and rolls back setup', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [false, false, false],
    });
    const driverProcess = new FakeAndroidDriverProcess();
    const adbCalls = [];
    let delayCalls = 0;
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake({
            async installApp(...args) {
                const [, , apkPath] = args;
                adbCalls.push(`install:${apkPath}`);
                return true;
            },
            async removePortForward() {
                adbCalls.push('removePortForward');
            },
            async forwardPort() {
                adbCalls.push('forwardPort');
                return 50051;
            },
            async forceStop(...args) {
                const [, , packageName] = args;
                adbCalls.push(`forceStop:${packageName}`);
                return { success: true };
            },
            async clearAppData(...args) {
                const [, , packageName] = args;
                adbCalls.push(`clearAppData:${packageName}`);
                return { success: true };
            },
            async isProcessRunning(...args) {
                const [, , packageName] = args;
                adbCalls.push(`isProcessRunning:${packageName}`);
                return false;
            },
        }),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => {
            delayCalls += 1;
            if (delayCalls === 1) {
                driverProcess.stderr.write('instrumentation crashed\n');
                driverProcess.emitExit(1);
            }
        },
        startAndroidDriverFn: () => driverProcess,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    })), /Android driver process exited before setup completed \(code 1\) for emulator-5554\..*stderr: instrumentation crashed/);
    strict_1.default.equal(delayCalls, 1);
    strict_1.default.equal(driverProcess.killed, true);
    strict_1.default.deepEqual(adbCalls, [
        // _cleanupStaleDriverProcesses: force-stop both packages, clear test
        // package state, then poll `pidof` until the instrumentation host exits.
        'forceStop:app.usbuitest.android.test',
        'forceStop:app.usbuitest.android',
        'clearAppData:app.usbuitest.android.test',
        'isProcessRunning:app.usbuitest.android.test',
        'install:/tmp/app-debug.apk',
        'install:/tmp/app-debug-androidTest.apk',
        'removePortForward',
        'forwardPort',
        // _rollbackFailedSetup: tear down the port forward, stop both packages,
        // then confirm the instrumentation host is gone before the error surfaces.
        'removePortForward',
        'forceStop:app.usbuitest.android',
        'forceStop:app.usbuitest.android.test',
        'isProcessRunning:app.usbuitest.android.test',
    ]);
});
(0, node_test_1.default)('GrpcDriverSetup includes Android process status in gRPC timeout failures', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [],
    });
    const driverProcess = new FakeAndroidDriverProcess();
    let wroteLog = false;
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: createAndroidAdbClientFake(),
        simctlClient: {},
        filePathUtil: createFilePathUtil({
            getIOSDriverAppPath: async () => null,
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => {
            if (!wroteLog) {
                wroteLog = true;
                driverProcess.stdout.write('waiting for instrumentation\n');
            }
        },
        startAndroidDriverFn: () => driverProcess,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'emulator-5554',
        deviceUUID: 'device-1',
        isAndroid: true,
        sdkVersion: 34,
        name: 'Android Emulator',
    })), /driver never became reachable over gRPC at 127\.0\.0\.1:50051 after 120s\. Process state: alive pid=9876\. Recent logs: stdout: waiting for instrumentation\./);
});
(0, node_test_1.default)('GrpcDriverSetup installs, starts, and initializes the iOS simulator driver', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [false, true],
        captureResponses: [
            {
                success: true,
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1179,
                screenHeight: 2556,
            },
        ],
    });
    const driverProcess = new FakeIOSDriverProcess();
    const calls = [];
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: {},
        simctlClient: {
            async installApp(deviceId, appPath) {
                calls.push(`install:${deviceId}:${appPath}`);
                return true;
            },
            async terminateApp(deviceId, bundleId) {
                calls.push(`terminate:${deviceId}:${bundleId}`);
            },
            startDriver(deviceId, port) {
                calls.push(`start:${deviceId}:${port}`);
                return driverProcess;
            },
            async listInstalledAppIds(deviceId) {
                calls.push(`appIds:${deviceId}`);
                return ['app.usbuitest.iosUITests.xctrunner', 'org.wikipedia'];
            },
        },
        filePathUtil: createFilePathUtil({
            ensureIOSAppsAvailable: async () => {
                calls.push('ensureIOS');
            },
        }),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        killStaleHostProcessesOnPortFn: async (port) => {
            calls.push(`cleanup:${port}`);
        },
        captureReadinessTimeoutMs: 1000,
        captureReadinessDelayMs: 0,
    });
    const device = await setup.setUp(new common_1.DeviceInfo({
        id: 'SIM-1',
        deviceUUID: 'SIM-1',
        isAndroid: false,
        sdkVersion: 17,
        name: 'iPhone 15 Pro',
    }));
    strict_1.default.equal(device.getDeviceInfo().id, 'SIM-1');
    strict_1.default.deepEqual(calls, [
        'ensureIOS',
        'install:SIM-1:/tmp/usb-ui-test-ios-test-Runner.app',
        'cleanup:50051',
        'terminate:SIM-1:app.usbuitest.iosUITests.xctrunner',
        'start:SIM-1:50051',
        'appIds:SIM-1',
    ]);
    strict_1.default.equal(grpcClient.channelCreations.length, 1);
    strict_1.default.equal(grpcClient.captureCalls, 1);
    strict_1.default.deepEqual(grpcClient.updateAppIdsCalls, [
        ['app.usbuitest.iosUITests.xctrunner', 'org.wikipedia'],
    ]);
});
(0, node_test_1.default)('GrpcDriverSetup surfaces an early iOS driver process exit during setup', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [false, false, false],
    });
    const driverProcess = new FakeIOSDriverProcess();
    let delayCalls = 0;
    let terminateCalls = 0;
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: {},
        simctlClient: {
            async installApp() {
                return true;
            },
            async terminateApp() {
                terminateCalls += 1;
            },
            startDriver() {
                return driverProcess;
            },
            async listInstalledAppIds() {
                return [];
            },
        },
        filePathUtil: createFilePathUtil(),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => {
            delayCalls += 1;
            if (delayCalls === 1) {
                driverProcess.stderr.write('driver crashed\n');
                driverProcess.emitExit(1);
            }
        },
        killStaleHostProcessesOnPortFn: async () => undefined,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'SIM-3',
        deviceUUID: 'SIM-3',
        isAndroid: false,
        sdkVersion: 17,
        name: 'iPhone 15 Pro Max',
    })), /iOS driver process exited before setup completed/);
    strict_1.default.equal(terminateCalls, 2);
});
(0, node_test_1.default)('GrpcDriverSetup fails when iOS screenshot capture never becomes ready after ping', async () => {
    const grpcClient = new FakeGrpcClient({
        pingResponses: [true],
        captureResponses: [
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
        ],
    });
    const driverProcess = new FakeIOSDriverProcess();
    const setup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
        adbClient: {},
        simctlClient: {
            async installApp() {
                return true;
            },
            async terminateApp() { },
            startDriver() {
                return driverProcess;
            },
            async listInstalledAppIds() {
                return ['org.wikipedia'];
            },
        },
        filePathUtil: createFilePathUtil(),
        grpcClientFactory: () => grpcClient,
        delayFn: async () => undefined,
        killStaleHostProcessesOnPortFn: async () => undefined,
        captureReadinessTimeoutMs: 20,
        captureReadinessDelayMs: 5,
    });
    await strict_1.default.rejects(() => setup.setUp(new common_1.DeviceInfo({
        id: 'SIM-4',
        deviceUUID: 'SIM-4',
        isAndroid: false,
        sdkVersion: 17,
        name: 'iPhone 14',
    })), /screenshot capture never became ready/);
});
//# sourceMappingURL=GrpcDriverSetup.test.js.map