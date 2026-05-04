"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const SimctlClient_js_1 = require("./SimctlClient.js");
(0, node_test_1.default)('SimctlClient.listInstalledApps parses app metadata from simctl listapps', async () => {
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async () => ({
            stdout: JSON.stringify({
                'org.wikipedia': {
                    CFBundleDisplayName: 'Wikipedia',
                    CFBundleVersion: '7.7.1',
                },
                'com.apple.mobilesafari': {
                    CFBundleName: 'Safari',
                },
            }),
            stderr: '',
        }),
    });
    const apps = await simctlClient.listInstalledApps('SIM-1');
    strict_1.default.deepEqual(apps.map((app) => app.toJson()), [
        new common_1.DeviceAppInfo({
            packageName: 'com.apple.mobilesafari',
            name: 'Safari',
            version: null,
        }).toJson(),
        new common_1.DeviceAppInfo({
            packageName: 'org.wikipedia',
            name: 'Wikipedia',
            version: '7.7.1',
        }).toJson(),
    ]);
});
(0, node_test_1.default)('SimctlClient.installApp uses simctl install for app overrides', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const installed = await simctlClient.installApp('SIM-1', '/tmp/My.app');
    strict_1.default.equal(installed, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'install', 'SIM-1', '/tmp/My.app'],
        },
    ]);
});
(0, node_test_1.default)('SimctlClient.openUrl uses simctl openurl', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const opened = await simctlClient.openUrl('SIM-1', 'wikipedia://settings');
    strict_1.default.equal(opened, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'openurl', 'SIM-1', 'wikipedia://settings'],
        },
    ]);
});
(0, node_test_1.default)('SimctlClient.setLocation uses simctl location set', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const result = await simctlClient.setLocation('SIM-1', '37.7749', '-122.4194');
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'location', 'SIM-1', 'set', '37.7749,-122.4194'],
        },
    ]);
});
(0, node_test_1.default)('SimctlClient.pressButton uses simctl io ui for physical buttons', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const result = await simctlClient.pressButton('SIM-1', 'home');
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'io', 'SIM-1', 'ui', 'home'],
        },
    ]);
});
(0, node_test_1.default)('SimctlClient.togglePermissions uses simctl privacy for location and applesimutils for others', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            if (file === 'which') {
                return { stdout: '/usr/local/bin/applesimutils\n', stderr: '' };
            }
            return { stdout: '', stderr: '' };
        },
    });
    const result = await simctlClient.togglePermissions('SIM-1', 'org.wikipedia', {
        location: 'allow',
        calendar: 'deny',
        camera: 'deny',
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(result.data, {
        appliedPermissions: ['location', 'calendar', 'camera'],
    });
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'privacy', 'SIM-1', 'grant', 'location-always', 'org.wikipedia'],
        },
        {
            file: 'xcrun',
            args: ['simctl', 'privacy', 'SIM-1', 'revoke', 'calendar', 'org.wikipedia'],
        },
        {
            file: 'which',
            args: ['applesimutils'],
        },
        {
            file: 'applesimutils',
            args: [
                '--byId',
                'SIM-1',
                '--bundle',
                'org.wikipedia',
                '--setPermissions',
                'camera=NO',
            ],
        },
    ]);
});
(0, node_test_1.default)('SimctlClient.togglePermissions uses simctl privacy only for supported custom permissions', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const result = await simctlClient.togglePermissions('SIM-1', 'org.wikipedia', {
        calendar: 'allow',
        photos: 'deny',
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(result.data, {
        appliedPermissions: ['calendar', 'photos'],
    });
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'privacy', 'SIM-1', 'grant', 'calendar', 'org.wikipedia'],
        },
        {
            file: 'xcrun',
            args: ['simctl', 'privacy', 'SIM-1', 'revoke', 'photos', 'org.wikipedia'],
        },
    ]);
});
(0, node_test_1.default)('SimctlClient.allowAllPermissions continues when applesimutils is missing', async () => {
    const execCalls = [];
    const simctlClient = new SimctlClient_js_1.SimctlClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            if (file === 'which') {
                return { stdout: '', stderr: '' };
            }
            return { stdout: '', stderr: '' };
        },
    });
    const result = await simctlClient.allowAllPermissions('SIM-1', 'org.wikipedia');
    strict_1.default.equal(result.success, true);
    strict_1.default.match(result.message ?? '', /applesimutils is not installed/i);
    strict_1.default.deepEqual(result.data, {
        appliedPermissions: [
            'calendar',
            'contacts',
            'location',
            'medialibrary',
            'microphone',
            'motion',
            'photos',
            'reminders',
            'siri',
        ],
        skippedPermissions: [
            'camera',
            'homeKit',
            'notifications',
            'speech',
            'userTracking',
        ],
        permissionWarning: 'Skipped pre-granting iOS permissions because applesimutils is not installed: camera, homeKit, notifications, speech, userTracking',
    });
    strict_1.default.deepEqual(execCalls, [
        {
            file: 'xcrun',
            args: ['simctl', 'privacy', 'SIM-1', 'grant', 'all', 'org.wikipedia'],
        },
        {
            file: 'which',
            args: ['applesimutils'],
        },
    ]);
});
//# sourceMappingURL=SimctlClient.test.js.map