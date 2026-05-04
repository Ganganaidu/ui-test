"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const CommonDriverActions_js_1 = require("../shared/CommonDriverActions.js");
const IOSSimulator_js_1 = require("./IOSSimulator.js");
/** Stub process handle that always reports alive (exitCode null, not killed). */
function stubDriverProcess() {
    return {
        pid: 1234,
        exitCode: null,
        killed: false,
        stdout: null,
        stderr: null,
        on() { return this; },
    };
}
/** Default recovery-related params for tests that don't exercise driver restart. */
function stubRecoveryParams() {
    return {
        driverProcess: stubDriverProcess(),
        restartDriver: async () => stubDriverProcess(),
    };
}
(0, node_test_1.default)('IOSSimulator refreshes app IDs before launchApp', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        async updateAppIds(appIds) {
            calls.push(`update:${appIds.join(',')}`);
            return { success: true };
        },
        async launchApp() {
            calls.push('launch');
            return { success: true, message: 'launched' };
        },
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async listInstalledAppIds() {
                calls.push('listAppIds');
                return ['app.usbuitest.iosUITests.xctrunner', 'org.wikipedia'];
            },
            async terminateApp() { },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const response = await runtime.launchApp(new common_1.LaunchAppAction({
        appUpload: new common_1.AppUpload({
            id: '',
            platform: 'ios',
            packageName: 'org.wikipedia',
        }),
        allowAllPermissions: false,
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'launched');
    strict_1.default.deepEqual(calls, [
        'listAppIds',
        'update:app.usbuitest.iosUITests.xctrunner,org.wikipedia',
        'launch',
    ]);
});
(0, node_test_1.default)('IOSSimulator routes scroll through gRPC swipe and installed-app listing through simctl', async () => {
    const grpcSwipeCalls = [];
    const grpcClient = {
        isConnected: true,
        async swipe(params) {
            grpcSwipeCalls.push(params);
            return { success: true, message: 'scrolled via grpc' };
        },
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async listInstalledApps() {
                return [
                    new common_1.DeviceAppInfo({
                        packageName: 'org.wikipedia',
                        name: 'Wikipedia',
                        version: '7.7.1',
                    }),
                ];
            },
            async listInstalledAppIds() {
                return [];
            },
            async terminateApp() { },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const scrollResponse = await runtime.scrollAbs(new common_1.ScrollAbsAction({
        startX: 50,
        startY: 60,
        endX: 70,
        endY: 80,
        durationMs: 600,
    }));
    const appListResponse = await runtime.getInstalledAppsResponse();
    strict_1.default.equal(scrollResponse.success, true);
    strict_1.default.equal(scrollResponse.message, 'scrolled via grpc');
    strict_1.default.deepEqual(grpcSwipeCalls, [
        { startX: 50, startY: 60, endX: 70, endY: 80, durationMs: 600 },
    ]);
    strict_1.default.deepEqual(appListResponse.data, {
        apps: [
            {
                packageName: 'org.wikipedia',
                name: 'Wikipedia',
                version: '7.7.1',
            },
        ],
    });
});
(0, node_test_1.default)('IOSSimulator terminates the runner before closing gRPC', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        close() {
            calls.push('close');
        },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async terminateApp() {
                calls.push('terminate');
            },
            async listInstalledAppIds() {
                return [];
            },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    await runtime.close();
    strict_1.default.deepEqual(calls, ['terminate', 'close']);
});
(0, node_test_1.default)('IOSSimulator routes home and physical button keys through simctl', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        async pressKey(key) {
            calls.push(`grpc:${key}`);
            return { success: true, message: 'pressed via grpc' };
        },
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async pressButton(_deviceId, button) {
                calls.push(`simctl:${button}`);
                return { success: true, message: `pressed ${button}` };
            },
            async terminateApp() { },
            async terminateAppResult() {
                return { success: true };
            },
            async listInstalledAppIds() {
                return [];
            },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const homeResponse = await runtime.home({});
    const powerResponse = await runtime.pressKey(new common_1.PressKeyAction({
        key: 'power',
    }));
    const enterResponse = await runtime.pressKey(new common_1.PressKeyAction({
        key: 'enter',
    }));
    strict_1.default.equal(homeResponse.message, 'pressed home');
    strict_1.default.equal(powerResponse.message, 'pressed lock');
    strict_1.default.equal(enterResponse.message, 'pressed via grpc');
    strict_1.default.deepEqual(calls, ['simctl:home', 'simctl:lock', 'grpc:enter']);
});
(0, node_test_1.default)('IOSSimulator uses simctl for setLocation', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async setLocation(_deviceId, lat, long) {
                calls.push(`${lat},${long}`);
                return { success: true, message: 'location set via simctl' };
            },
            async terminateApp() { },
            async terminateAppResult() {
                return { success: true };
            },
            async listInstalledAppIds() {
                return [];
            },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const response = await runtime.setLocation(new common_1.SetLocationAction({
        lat: '37.7749',
        long: '-122.4194',
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'location set via simctl');
    strict_1.default.deepEqual(calls, ['37.7749,-122.4194']);
});
(0, node_test_1.default)('IOSSimulator fails explicitly when clearState is requested without reinstall context', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        async updateAppIds() {
            return { success: true };
        },
        async launchApp() {
            calls.push('grpc:launch');
            return { success: true, message: 'launched' };
        },
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async listInstalledAppIds() {
                return ['org.wikipedia'];
            },
            async terminateApp() { },
            async terminateAppResult() {
                calls.push('simctl:terminate');
                return { success: true };
            },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const response = await runtime.launchApp(new common_1.LaunchAppAction({
        appUpload: new common_1.AppUpload({
            id: '',
            platform: 'ios',
            packageName: 'org.wikipedia',
        }),
        clearState: true,
        stopAppBeforeLaunch: true,
        allowAllPermissions: false,
    }));
    strict_1.default.equal(response.success, false);
    strict_1.default.match(response.message ?? '', /clearState is not supported in usb-ui-test-ts/i);
    strict_1.default.deepEqual(calls, ['simctl:terminate']);
});
(0, node_test_1.default)('IOSSimulator continues launch when allowAllPermissions warns about missing applesimutils', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        async updateAppIds() {
            calls.push('grpc:updateAppIds');
            return { success: true };
        },
        async launchApp() {
            calls.push('grpc:launch');
            return {
                success: true,
                message: 'launched',
                data: { packageName: 'org.wikipedia' },
            };
        },
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async listInstalledAppIds() {
                calls.push('simctl:listAppIds');
                return ['org.wikipedia'];
            },
            async allowAllPermissions() {
                calls.push('simctl:allowAllPermissions');
                return {
                    success: true,
                    message: 'Skipped pre-granting iOS permissions because applesimutils is not installed: camera',
                    data: {
                        skippedPermissions: ['camera'],
                        permissionWarning: 'Skipped pre-granting iOS permissions because applesimutils is not installed: camera',
                    },
                };
            },
            async terminateApp() { },
            async terminateAppResult() {
                return { success: true };
            },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const response = await runtime.launchApp(new common_1.LaunchAppAction({
        appUpload: new common_1.AppUpload({
            id: '',
            platform: 'ios',
            packageName: 'org.wikipedia',
        }),
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'launched Skipped pre-granting iOS permissions because applesimutils is not installed: camera');
    strict_1.default.deepEqual(response.data, {
        packageName: 'org.wikipedia',
        skippedPermissions: ['camera'],
        permissionWarning: 'Skipped pre-granting iOS permissions because applesimutils is not installed: camera',
    });
    strict_1.default.deepEqual(calls, [
        'simctl:listAppIds',
        'grpc:updateAppIds',
        'simctl:allowAllPermissions',
        'grpc:launch',
    ]);
});
(0, node_test_1.default)('IOSSimulator applies supported custom permissions through simctl before launch', async () => {
    const calls = [];
    const grpcClient = {
        isConnected: true,
        async updateAppIds() {
            calls.push('grpc:updateAppIds');
            return { success: true };
        },
        async launchApp() {
            calls.push('grpc:launch');
            return {
                success: true,
                message: 'launched',
            };
        },
        close() { },
    };
    const runtime = new IOSSimulator_js_1.IOSSimulator({
        commonDriverActions: new CommonDriverActions_js_1.CommonDriverActions({
            grpcClient: grpcClient,
        }),
        simctlClient: {
            async listInstalledAppIds() {
                calls.push('simctl:listAppIds');
                return ['org.wikipedia'];
            },
            async togglePermissions() {
                calls.push('simctl:togglePermissions');
                return {
                    success: true,
                    data: {
                        appliedPermissions: ['calendar'],
                    },
                };
            },
            async terminateApp() { },
            async terminateAppResult() {
                return { success: true };
            },
            async listInstalledApps() {
                return [];
            },
            async openUrl() {
                return true;
            },
        },
        deviceId: 'SIM-1',
        ...stubRecoveryParams(),
    });
    const response = await runtime.launchApp(new common_1.LaunchAppAction({
        appUpload: new common_1.AppUpload({
            id: '',
            platform: 'ios',
            packageName: 'org.wikipedia',
        }),
        allowAllPermissions: false,
        permissions: {
            calendar: 'allow',
        },
    }));
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(response.message, 'launched');
    strict_1.default.deepEqual(response.data, {
        packageName: 'org.wikipedia',
        appliedPermissions: ['calendar'],
    });
    strict_1.default.deepEqual(calls, [
        'simctl:listAppIds',
        'grpc:updateAppIds',
        'simctl:togglePermissions',
        'grpc:launch',
    ]);
});
//# sourceMappingURL=IOSSimulator.test.js.map