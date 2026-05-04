"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const AdbClient_js_1 = require("./AdbClient.js");
function adbExecError(stderr) {
    const err = new Error('Command failed');
    err.code = 255;
    err.stderr = stderr;
    err.stdout = '';
    return err;
}
(0, node_test_1.default)('isUndeclaredPermissionGrantFailure matches pm grant SecurityException stderr', () => {
    strict_1.default.equal((0, AdbClient_js_1.isUndeclaredPermissionGrantFailure)("java.lang.SecurityException: Package org.wikipedia.dev has not requested permission android.permission.CAMERA"), true);
    strict_1.default.equal((0, AdbClient_js_1.isUndeclaredPermissionGrantFailure)('device offline'), false);
});
(0, node_test_1.default)('AdbClient.togglePermissions treats undeclared permission grant as success', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            throw adbExecError("\nException occurred while executing 'grant':\njava.lang.SecurityException: Package com.example.app has not requested permission android.permission.CAMERA\n");
        },
    });
    const result = await adbClient.togglePermissions('/platform-tools/adb', 'emulator-5554', 'com.example.app', { camera: 'allow' });
    strict_1.default.equal(result.success, true);
    strict_1.default.match(execCalls[0]?.args.join(' '), /pm grant com\.example\.app android\.permission\.CAMERA/);
});
(0, node_test_1.default)('AdbClient.togglePermissions fails when pm grant fails for reasons other than undeclared', async () => {
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (_file, args) => {
            if (args.includes('android.permission.CAMERA')) {
                throw adbExecError("\nException occurred while executing 'grant':\njava.lang.SecurityException: Package com.example.app has not requested permission android.permission.CAMERA\n");
            }
            throw adbExecError('Error: device offline');
        },
    });
    const result = await adbClient.togglePermissions('/platform-tools/adb', 'emulator-5554', 'com.example.app', { camera: 'allow', microphone: 'allow' });
    strict_1.default.equal(result.success, false);
    strict_1.default.match(result.message ?? '', /RECORD_AUDIO|microphone|offline|Failed to update/i);
});
(0, node_test_1.default)('AdbClient.allowAllPermissions succeeds when every pm grant is undeclared', async () => {
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (_file, args) => {
            if (args.includes('appops')) {
                return { stdout: '', stderr: '' };
            }
            throw adbExecError("java.lang.SecurityException: Package com.minimal.app has not requested permission android.permission.CAMERA");
        },
    });
    const result = await adbClient.allowAllPermissions('/platform-tools/adb', 'emulator-5554', 'com.minimal.app');
    strict_1.default.equal(result.success, true);
});
(0, node_test_1.default)('AdbClient.installApp uses reinstall and grant flags for app overrides', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const installed = await adbClient.installApp('/platform-tools/adb', 'emulator-5554', '/tmp/app.apk');
    strict_1.default.equal(installed, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: ['-s', 'emulator-5554', 'install', '-r', '-g', '/tmp/app.apk'],
        },
    ]);
});
(0, node_test_1.default)('AdbClient.openDeepLink uses adb am start with the deeplink URL', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const opened = await adbClient.openDeepLink('/platform-tools/adb', 'emulator-5554', 'wikipedia://settings');
    strict_1.default.equal(opened, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'am',
                'start',
                '-W',
                '-a',
                'android.intent.action.VIEW',
                '-d',
                'wikipedia://settings',
            ],
        },
    ]);
});
(0, node_test_1.default)('AdbClient.swipe uses adb input swipe with absolute coordinates', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const result = await adbClient.swipe('/platform-tools/adb', 'emulator-5554', {
        startX: 10,
        startY: 20,
        endX: 30,
        endY: 40,
        durationMs: 700,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'input',
                'swipe',
                '10',
                '20',
                '30',
                '40',
                '700',
            ],
        },
    ]);
});
(0, node_test_1.default)('AdbClient.performKeyPress maps logical keys to adb key events', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const result = await adbClient.performKeyPress('/platform-tools/adb', 'emulator-5554', 'enter');
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'input',
                'keyevent',
                'KEYCODE_ENTER',
            ],
        },
    ]);
});
(0, node_test_1.default)('AdbClient.hideKeyboard presses back only when the keyboard is visible', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            if (args.includes('dumpsys')) {
                return { stdout: 'mInputShown=true', stderr: '' };
            }
            return { stdout: '', stderr: '' };
        },
    });
    const result = await adbClient.hideKeyboard('/platform-tools/adb', 'emulator-5554');
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: ['-s', 'emulator-5554', 'shell', 'dumpsys', 'input_method'],
        },
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'input',
                'keyevent',
                'KEYCODE_BACK',
            ],
        },
    ]);
});
(0, node_test_1.default)('AdbClient.launchAppCli resolves the launcher activity before launching', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            if (args.includes('resolve-activity')) {
                return {
                    stdout: 'com.example.app/.MainActivity\n',
                    stderr: '',
                };
            }
            return { stdout: '', stderr: '' };
        },
    });
    const result = await adbClient.launchAppCli('/platform-tools/adb', 'emulator-5554', 'com.example.app', {
        foo: {
            key: 'foo',
            type: 'arg',
            value: 'bar',
        },
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'cmd',
                'package',
                'resolve-activity',
                '--brief',
                'com.example.app',
                '-c',
                'android.intent.category.LAUNCHER',
            ],
        },
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'am',
                'start',
                '-W',
                '-n',
                'com.example.app/.MainActivity',
                '-e',
                'foo',
                'bar',
            ],
        },
    ]);
});
(0, node_test_1.default)('AdbClient.togglePermissions uses pm grant and appops for Android permission helpers', async () => {
    const execCalls = [];
    const adbClient = new AdbClient_js_1.AdbClient({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            return { stdout: '', stderr: '' };
        },
    });
    const result = await adbClient.togglePermissions('/platform-tools/adb', 'emulator-5554', 'com.example.app', {
        camera: 'allow',
        overlay: 'deny',
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(execCalls, [
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'pm',
                'grant',
                'com.example.app',
                'android.permission.CAMERA',
            ],
        },
        {
            file: '/platform-tools/adb',
            args: [
                '-s',
                'emulator-5554',
                'shell',
                'appops',
                'set',
                'com.example.app',
                'SYSTEM_ALERT_WINDOW',
                'deny',
            ],
        },
    ]);
});
//# sourceMappingURL=AdbClient.test.js.map