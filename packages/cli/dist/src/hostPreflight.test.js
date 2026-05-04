"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const hostPreflight_js_1 = require("./hostPreflight.js");
function createFilePathUtil(params) {
    return {
        async getADBPath() {
            return params?.getADBPath ? await params.getADBPath() : null;
        },
        async getDriverAppPath() {
            return params?.getDriverAppPath ? await params.getDriverAppPath() : null;
        },
        async getDriverTestAppPath() {
            return params?.getDriverTestAppPath ? await params.getDriverTestAppPath() : null;
        },
        getResourceDir() {
            return params?.getResourceDir ? params.getResourceDir() : '/tmp/usb-ui-test-resources';
        },
    };
}
function createDependencies(params) {
    return {
        createFilePathUtil: () => params?.filePathUtil ?? createFilePathUtil(),
        async execFile(file, args) {
            const key = `${file} ${args.join(' ')}`.trim();
            if (params?.failingCommands?.has(key)) {
                throw new Error(`mock failure for ${key}`);
            }
            return { stdout: 'ok', stderr: '' };
        },
        async resolveCommand(command) {
            if (params?.commandPaths && command in params.commandPaths) {
                return params.commandPaths[command] ?? null;
            }
            return `/mock/${command}`;
        },
        async pathExists(candidatePath) {
            return params?.existingPaths?.has(candidatePath) ?? false;
        },
        getPlatform: () => params?.platform ?? 'darwin',
        async checkAndroidRecordingAvailability() {
            return params?.androidRecordingResponse ?? new common_1.DeviceNodeResponse({
                success: true,
                message: 'scrcpy ready',
            });
        },
        async checkIOSRecordingAvailability() {
            return params?.iosRecordingResponse ?? new common_1.DeviceNodeResponse({
                success: true,
                message: 'xcrun simctl ready',
            });
        },
    };
}
(0, node_test_1.default)('runHostPreflight marks a command as blocking when it exists but the smoke check fails', async () => {
    const dependencies = createDependencies({
        filePathUtil: createFilePathUtil({
            async getADBPath() {
                return '/mock/adb';
            },
            async getDriverAppPath() {
                return '/mock/resources/android/app-debug.apk';
            },
            async getDriverTestAppPath() {
                return '/mock/resources/android/app-debug-androidTest.apk';
            },
            getResourceDir() {
                return '/mock/resources';
            },
        }),
        failingCommands: new Set(['/mock/emulator -list-avds']),
    });
    const result = await (0, hostPreflight_js_1.runHostPreflight)({
        requestedPlatforms: [common_1.PLATFORM_ANDROID],
    }, dependencies);
    const emulatorCheck = result.checks.find((check) => check.id === 'emulator');
    strict_1.default.ok(emulatorCheck);
    strict_1.default.equal(emulatorCheck.status, 'error');
    strict_1.default.equal((0, hostPreflight_js_1.hasBlockingPreflightFailures)(result), true);
    strict_1.default.equal((0, hostPreflight_js_1.shouldBlockLocalRunPreflight)(result), true);
});
(0, node_test_1.default)('runHostPreflight reports missing resource files as blocking failures', async () => {
    const resourceDir = '/mock/resources';
    const dependencies = createDependencies({
        filePathUtil: createFilePathUtil({
            getResourceDir() {
                return resourceDir;
            },
        }),
        existingPaths: new Set([
            '/bin/bash',
            `${resourceDir}/ios/usb-ui-test-ios-test-Runner.zip`,
        ]),
    });
    const result = await (0, hostPreflight_js_1.runHostPreflight)({
        requestedPlatforms: [common_1.PLATFORM_IOS],
    }, dependencies);
    const archiveCheck = result.checks.find((check) => check.id === 'ios-driver-archive');
    strict_1.default.ok(archiveCheck);
    strict_1.default.equal(archiveCheck.status, 'error');
    strict_1.default.match(archiveCheck.detail ?? '', /usb-ui-test-ios\.zip/);
    strict_1.default.equal((0, hostPreflight_js_1.hasBlockingPreflightFailures)(result), true);
});
(0, node_test_1.default)('warning-only results do not block a local run', async () => {
    const resourceDir = '/mock/resources';
    const dependencies = createDependencies({
        filePathUtil: createFilePathUtil({
            getResourceDir() {
                return resourceDir;
            },
        }),
        commandPaths: {
            ffmpeg: null,
            applesimutils: null,
            lsof: null,
            ps: null,
            kill: null,
        },
        existingPaths: new Set([
            '/bin/bash',
            `${resourceDir}/ios/usb-ui-test-ios.zip`,
            `${resourceDir}/ios/usb-ui-test-ios-test-Runner.zip`,
        ]),
    });
    const result = await (0, hostPreflight_js_1.runHostPreflight)({
        requestedPlatforms: [common_1.PLATFORM_IOS],
    }, dependencies);
    strict_1.default.equal((0, hostPreflight_js_1.hasBlockingPreflightFailures)(result), false);
    strict_1.default.equal((0, hostPreflight_js_1.shouldBlockLocalRunPreflight)(result), false);
    const report = (0, hostPreflight_js_1.formatHostPreflightReport)(result, 'doctor');
    strict_1.default.match(report, /Warnings/);
    strict_1.default.match(report, /ffmpeg/);
});
(0, node_test_1.default)('runHostPreflight only evaluates the requested platform scope', async () => {
    const result = await (0, hostPreflight_js_1.runHostPreflight)({
        requestedPlatforms: [common_1.PLATFORM_ANDROID],
    }, createDependencies({
        filePathUtil: createFilePathUtil({
            async getADBPath() {
                return '/mock/adb';
            },
            async getDriverAppPath() {
                return '/mock/resources/android/app-debug.apk';
            },
            async getDriverTestAppPath() {
                return '/mock/resources/android/app-debug-androidTest.apk';
            },
            getResourceDir() {
                return '/mock/resources';
            },
        }),
        platform: 'linux',
    }));
    strict_1.default.equal(result.checks.some((check) => check.platform === common_1.PLATFORM_IOS), false);
});
//# sourceMappingURL=hostPreflight.test.js.map