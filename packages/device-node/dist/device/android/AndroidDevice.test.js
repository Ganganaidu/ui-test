"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const CommonDriverActions_js_1 = require("../shared/CommonDriverActions.js");
const AndroidDevice_js_1 = require("./AndroidDevice.js");
(0, node_test_1.default)('AndroidDevice routes scroll through adb instead of gRPC swipe', async () => {
    const swipeCalls = [];
    let grpcSwipeCalls = 0;
    const grpcClient = {
        isConnected: true,
        async swipe() {
            grpcSwipeCalls += 1;
            return { success: true };
        },
        close() { },
    };
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        adbClient: {
            async swipe(_adbPath, _deviceSerial, params) {
                swipeCalls.push(params);
                return { success: true, message: 'scrolled via adb' };
            },
            async removePortForward() { },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const response = await runtime.scrollAbs(new common_1.ScrollAbsAction({
        startX: 10,
        startY: 20,
        endX: 30,
        endY: 40,
        durationMs: 500,
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'scrolled via adb');
    strict_1.default.equal(grpcSwipeCalls, 0);
    strict_1.default.deepEqual(swipeCalls, [
        { startX: 10, startY: 20, endX: 30, endY: 40, durationMs: 500 },
    ]);
});
(0, node_test_1.default)('AndroidDevice opens deep links through adb', async () => {
    const openedLinks = [];
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: {
                isConnected: true,
                close() { },
            },
        }),
        adbClient: {
            async openDeepLink(_adbPath, _deviceSerial, deeplink) {
                openedLinks.push(deeplink);
                return true;
            },
            async removePortForward() { },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const response = await runtime.openDeepLink(new common_1.DeeplinkAction({
        deeplink: 'wikipedia://settings',
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'Successfully opened deep link: wikipedia://settings');
    strict_1.default.deepEqual(openedLinks, ['wikipedia://settings']);
});
(0, node_test_1.default)('AndroidDevice keeps installed-app listing on driver gRPC and removes port forwarding on close', async () => {
    const calls = [];
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: {
                isConnected: true,
                async getAppList() {
                    return {
                        success: true,
                        apps: [
                            new common_1.DeviceAppInfo({
                                packageName: 'org.wikipedia',
                                name: 'Wikipedia',
                                version: '7.7.1',
                            }),
                        ],
                    };
                },
                close() {
                    calls.push('close');
                },
            },
        }),
        adbClient: {
            async removePortForward() {
                calls.push('removePortForward');
            },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const appListResponse = await runtime.getInstalledAppsResponse();
    await runtime.close();
    strict_1.default.equal(appListResponse.success, true);
    strict_1.default.deepEqual(appListResponse.data, {
        apps: [
            {
                packageName: 'org.wikipedia',
                name: 'Wikipedia',
                version: '7.7.1',
            },
        ],
    });
    strict_1.default.deepEqual(calls, ['removePortForward', 'close']);
});
(0, node_test_1.default)('AndroidDevice routes back, home, hideKeyboard, and rotate through adb', async () => {
    const calls = [];
    let grpcBackCalls = 0;
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: {
                isConnected: true,
                async back() {
                    grpcBackCalls += 1;
                    return { success: true };
                },
                close() { },
            },
        }),
        adbClient: {
            async back() {
                calls.push('back');
                return { success: true, message: 'back via adb' };
            },
            async home() {
                calls.push('home');
                return { success: true, message: 'home via adb' };
            },
            async hideKeyboard() {
                calls.push('hideKeyboard');
                return { success: true, message: 'keyboard hidden' };
            },
            async rotate() {
                calls.push('rotate');
                return {
                    success: true,
                    message: 'rotated',
                    data: { orientation: 'landscape' },
                };
            },
            async removePortForward() { },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const backResponse = await runtime.back({});
    const homeResponse = await runtime.home({});
    const hideKeyboardResponse = await runtime.hideKeyboard({});
    const rotateResponse = await runtime.rotate({});
    strict_1.default.equal(backResponse.message, 'back via adb');
    strict_1.default.equal(homeResponse.message, 'home via adb');
    strict_1.default.equal(hideKeyboardResponse.message, 'keyboard hidden');
    strict_1.default.equal(rotateResponse.data?.orientation, 'landscape');
    strict_1.default.equal(grpcBackCalls, 0);
    strict_1.default.deepEqual(calls, ['back', 'home', 'hideKeyboard', 'rotate']);
});
(0, node_test_1.default)('AndroidDevice falls back to gRPC for unmapped key presses', async () => {
    const calls = [];
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: {
                isConnected: true,
                async pressKey(key) {
                    calls.push(`grpc:${key}`);
                    return { success: true, message: 'pressed via grpc' };
                },
                close() { },
            },
        }),
        adbClient: {
            async performKeyPress() {
                calls.push('adb');
                return {
                    success: false,
                    message: 'Android key is not mapped for adb: customKey',
                    data: { handled: false },
                };
            },
            async removePortForward() { },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const response = await runtime.pressKey(new common_1.PressKeyAction({
        key: 'customKey',
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'pressed via grpc');
    strict_1.default.deepEqual(calls, ['adb', 'grpc:customKey']);
});
(0, node_test_1.default)('AndroidDevice applies adb prelaunch steps before the driver launch path', async () => {
    const calls = [];
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: {
                isConnected: true,
                async launchApp() {
                    calls.push('grpc:launch');
                    return { success: true, message: 'launched' };
                },
                close() { },
            },
        }),
        adbClient: {
            async isPackageInstalled() {
                calls.push('adb:isPackageInstalled');
                return { success: true, data: { installed: true } };
            },
            async forceStop() {
                calls.push('adb:forceStop');
                return { success: true };
            },
            async clearAppData() {
                calls.push('adb:clearAppData');
                return { success: true };
            },
            async allowAllPermissions() {
                calls.push('adb:allowAllPermissions');
                return { success: true };
            },
            async removePortForward() { },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const response = await runtime.launchApp(new common_1.LaunchAppAction({
        appUpload: new common_1.AppUpload({
            id: '',
            platform: 'android',
            packageName: 'org.wikipedia',
        }),
        clearState: true,
        stopAppBeforeLaunch: true,
        allowAllPermissions: true,
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'launched');
    strict_1.default.deepEqual(calls, [
        'adb:isPackageInstalled',
        'adb:forceStop',
        'adb:clearAppData',
        'adb:allowAllPermissions',
        'grpc:launch',
    ]);
});
(0, node_test_1.default)('AndroidDevice enables mock location before delegating coordinates to gRPC', async () => {
    const calls = [];
    const runtime = new AndroidDevice_js_1.AndroidDevice({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: {
                isConnected: true,
                async setLocation() {
                    calls.push('grpc:setLocation');
                    return { success: true, message: 'location set' };
                },
                close() { },
            },
        }),
        adbClient: {
            async performMockLocation() {
                calls.push('adb:mockLocation');
                return { success: true };
            },
            async removePortForward() { },
        },
        adbPath: '/usr/bin/adb',
        deviceSerial: 'emulator-5554',
    });
    const response = await runtime.setLocation(new common_1.SetLocationAction({
        lat: '37.7749',
        long: '-122.4194',
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'location set');
    strict_1.default.deepEqual(calls, ['adb:mockLocation', 'grpc:setLocation']);
});
//# sourceMappingURL=AndroidDevice.test.js.map