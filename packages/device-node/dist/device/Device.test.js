"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const Device_js_1 = require("./Device.js");
function createRuntime(overrides) {
    return {
        setShouldEnsureStability() { },
        isConnected() {
            return true;
        },
        async tap() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async tapPercent() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async longPress() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async enterText() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async eraseText() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async scrollAbs() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async back() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async home() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async rotate() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async hideKeyboard() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async pressKey() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async launchApp() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async killApp() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async openDeepLink() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async setLocation() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async switchToPrimaryApp() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async checkAppInForeground() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async captureState() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async getInstalledAppsResponse() {
            return new common_1.DeviceNodeResponse({ success: true, data: { apps: [] } });
        },
        async getInstalledApps() {
            return [];
        },
        async getScreenshot() {
            return new common_1.DeviceNodeResponse({ success: true, data: { screenshot: 'image' } });
        },
        async getHierarchy() {
            return new common_1.DeviceNodeResponse({ success: true, data: { hierarchy: '[]' } });
        },
        async getScreenshotAndHierarchy() {
            return {
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 100,
                screenHeight: 200,
            };
        },
        async close() { },
        killDriver() { },
        ...overrides,
    };
}
function createIOSDeviceInfo() {
    return new common_1.DeviceInfo({
        id: 'SIM-1',
        deviceUUID: 'SIM-1',
        isAndroid: false,
        sdkVersion: 17,
        name: 'iPhone 15 Pro',
    });
}
(0, node_test_1.default)('Device delegates launchApp and stability preference to the runtime', async () => {
    const calls = [];
    const runtime = createRuntime({
        setShouldEnsureStability(shouldEnsureStability) {
            calls.push(shouldEnsureStability);
        },
        async launchApp() {
            calls.push('launch');
            return new common_1.DeviceNodeResponse({ success: true, message: 'launched' });
        },
    });
    const device = new Device_js_1.Device({
        deviceInfo: createIOSDeviceInfo(),
        runtime,
    });
    const response = await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-1',
        shouldEnsureStability: false,
        action: new common_1.LaunchAppAction({
            appUpload: new common_1.AppUpload({
                id: '',
                platform: 'ios',
                packageName: 'org.wikipedia',
            }),
        }),
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'launched');
    strict_1.default.deepEqual(calls, [false, 'launch']);
});
(0, node_test_1.default)('Device routes parity primitives to the runtime', async () => {
    const calls = [];
    const runtime = createRuntime({
        async tapPercent() {
            calls.push('tapPercent');
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async eraseText() {
            calls.push('eraseText');
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async rotate() {
            calls.push('rotate');
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async getScreenshot() {
            calls.push('getScreenshot');
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async getHierarchy() {
            calls.push('getHierarchy');
            return new common_1.DeviceNodeResponse({ success: true });
        },
    });
    const device = new Device_js_1.Device({
        deviceInfo: createIOSDeviceInfo(),
        runtime,
    });
    await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-1',
        action: new common_1.TapPercentAction({
            point: new common_1.PointPercent({ xPercent: 0.5, yPercent: 0.5 }),
        }),
    }));
    await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-2',
        action: new common_1.EraseTextAction(),
    }));
    await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-3',
        action: new common_1.RotateAction(),
    }));
    await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-4',
        action: new common_1.GetScreenshotAction(),
    }));
    await device.executeAction(new common_1.DeviceActionRequest({
        requestId: 'req-5',
        action: new common_1.GetHierarchyAction(),
    }));
    strict_1.default.deepEqual(calls, [
        'tapPercent',
        'eraseText',
        'rotate',
        'getScreenshot',
        'getHierarchy',
    ]);
});
(0, node_test_1.default)('Device exposes runtime screenshot and installed app helpers', async () => {
    const runtime = createRuntime({
        async getInstalledApps() {
            return [
                {
                    packageName: 'org.wikipedia',
                    name: 'Wikipedia',
                    version: '7.7.1',
                    toJson() {
                        return {
                            packageName: 'org.wikipedia',
                            name: 'Wikipedia',
                            version: '7.7.1',
                        };
                    },
                },
            ];
        },
        async getScreenshotAndHierarchy() {
            return {
                screenshot: 'base64',
                hierarchy: '[]',
                screenWidth: 1179,
                screenHeight: 2556,
            };
        },
    });
    const device = new Device_js_1.Device({
        deviceInfo: createIOSDeviceInfo(),
        runtime,
    });
    const apps = await device.getInstalledApps();
    const screenshot = await device.getScreenshotAndHierarchy();
    strict_1.default.equal(apps.length, 1);
    strict_1.default.equal(apps[0]?.packageName, 'org.wikipedia');
    strict_1.default.deepEqual(screenshot, {
        screenshot: 'base64',
        hierarchy: '[]',
        screenWidth: 1179,
        screenHeight: 2556,
    });
});
(0, node_test_1.default)('Device delegates startRecording through the recording controller with the device platform', async () => {
    const calls = [];
    const device = new Device_js_1.Device({
        deviceInfo: createIOSDeviceInfo(),
        runtime: createRuntime(),
        recordingController: {
            async startRecording(params) {
                calls.push(params);
                return new common_1.DeviceNodeResponse({ success: true, message: 'started' });
            },
            async stopRecording() {
                return new common_1.DeviceNodeResponse({ success: true });
            },
            async cleanupDevice() { },
            async abortRecording() { },
        },
    });
    const response = await device.startRecording(new common_1.RecordingRequest({
        runId: 'run',
        testId: 'case',
        apiKey: 'key',
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.deepEqual(calls, [
        {
            deviceId: 'SIM-1',
            platform: 'ios',
            sdkVersion: '17',
            recordingRequest: new common_1.RecordingRequest({
                runId: 'run',
                testId: 'case',
                apiKey: 'key',
            }),
        },
    ]);
});
(0, node_test_1.default)('Device.closeConnection cleans up active recordings before closing the runtime', async () => {
    const calls = [];
    const device = new Device_js_1.Device({
        deviceInfo: createIOSDeviceInfo(),
        runtime: createRuntime({
            async close() {
                calls.push('close');
            },
        }),
        recordingController: {
            async startRecording() {
                return new common_1.DeviceNodeResponse({ success: true });
            },
            async stopRecording() {
                return new common_1.DeviceNodeResponse({ success: true });
            },
            async cleanupDevice() {
                calls.push('cleanup');
            },
            async abortRecording() { },
        },
    });
    await device.closeConnection();
    strict_1.default.deepEqual(calls, ['cleanup', 'close']);
});
//# sourceMappingURL=Device.test.js.map