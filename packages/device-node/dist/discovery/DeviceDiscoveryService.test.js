"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_events_1 = require("node:events");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = __importDefault(require("node:path"));
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const DeviceDiscoveryService_js_1 = require("./DeviceDiscoveryService.js");
class FakeChildProcess extends node_events_1.EventEmitter {
    pid = 4321;
    exitCode = null;
    stdout = new node_stream_1.PassThrough();
    stderr = new node_stream_1.PassThrough();
    unref() { }
}
(0, node_test_1.default)('DeviceDiscoveryService detects runnable, offline, and unauthorized Android targets', async () => {
    const discoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService({
        execFileFn: async (file, args) => {
            if (file === '/platform-tools/adb' && args[0] === 'devices') {
                return {
                    stdout: [
                        'List of devices attached',
                        'emulator-5554 device product:sdk_gphone64_arm64 model:Pixel_8 device:emu64xa',
                        'R3CN30 offline usb:1-1 model:Galaxy_S23',
                        'R52N30 unauthorized usb:1-2 model:Pixel_7',
                        '',
                    ].join('\n'),
                    stderr: '',
                };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.build.version.sdk')) {
                return { stdout: '34\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.build.version.release')) {
                return { stdout: '14\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.product.model')) {
                return { stdout: 'Pixel 8\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.kernel.qemu')) {
                return { stdout: '1\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args[2] === 'emu') {
                return { stdout: 'Pixel_8_API_34\nOK\n', stderr: '' };
            }
            if (file === 'which' && args[0] === 'emulator') {
                return { stdout: '/usr/bin/emulator\n', stderr: '' };
            }
            if (file === '/usr/bin/emulator' && args[0] === '-list-avds') {
                return { stdout: '', stderr: '' };
            }
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
        },
    });
    const inventory = await discoveryService.detectInventory('/platform-tools/adb');
    const runnableAndroid = inventory.entries.find((entry) => entry.runnable);
    const offlineAndroid = inventory.entries.find((entry) => entry.state === 'offline');
    const unauthorizedAndroid = inventory.entries.find((entry) => entry.state === 'unauthorized');
    strict_1.default.equal(runnableAndroid?.selectionId, 'android-avd:Pixel_8_API_34');
    strict_1.default.equal(runnableAndroid?.displayName, 'Pixel_8_API_34 - Android 14 - emulator-5554');
    strict_1.default.equal(runnableAndroid?.deviceInfo?.sdkVersion, 34);
    strict_1.default.equal(offlineAndroid?.displayName, 'Galaxy S23 - R3CN30');
    strict_1.default.equal(unauthorizedAndroid?.displayName, 'Pixel 7 - R52N30');
});
(0, node_test_1.default)('DeviceDiscoveryService keeps unexpected Android adb states as unavailable targets', async () => {
    const discoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService({
        execFileFn: async (file, args) => {
            if (file === '/platform-tools/adb' && args[0] === 'devices') {
                return {
                    stdout: [
                        'List of devices attached',
                        'R9CN30 no permissions (user in plugdev group; are your udev rules wrong?) usb:1-1 model:Pixel_7',
                        '',
                    ].join('\n'),
                    stderr: '',
                };
            }
            if (file === 'which' && args[0] === 'emulator') {
                return { stdout: '/usr/bin/emulator\n', stderr: '' };
            }
            if (file === '/usr/bin/emulator' && args[0] === '-list-avds') {
                return { stdout: '', stderr: '' };
            }
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
        },
    });
    const inventory = await discoveryService.detectInventory('/platform-tools/adb');
    const unavailableAndroid = inventory.entries.find((entry) => entry.state === 'unavailable');
    strict_1.default.equal(unavailableAndroid?.displayName, 'Pixel 7 - R9CN30');
    strict_1.default.equal(unavailableAndroid?.stateDetail, 'no permissions (user in plugdev group; are your udev rules wrong?)');
    strict_1.default.equal(unavailableAndroid?.runnable, false);
    strict_1.default.equal(unavailableAndroid?.startable, false);
});
(0, node_test_1.default)('DeviceDiscoveryService discovers installed Android AVDs and skips already-running emulators', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-avd-discovery-'));
    const sdkDir = node_path_1.default.join(tempDir, 'sdk');
    const avdHome = node_path_1.default.join(tempDir, 'avd-home');
    const emulatorBinary = node_path_1.default.join(sdkDir, 'emulator', 'emulator');
    const avdManagerBinary = node_path_1.default.join(sdkDir, 'cmdline-tools', 'latest', 'bin', 'avdmanager');
    const runningAvdDir = node_path_1.default.join(avdHome, 'Pixel_8_API_34.avd');
    const startableAvdDir = node_path_1.default.join(avdHome, 'Pixel_7_API_33.avd');
    await (0, promises_1.mkdir)(node_path_1.default.dirname(emulatorBinary), { recursive: true });
    await (0, promises_1.mkdir)(node_path_1.default.dirname(avdManagerBinary), { recursive: true });
    await (0, promises_1.mkdir)(runningAvdDir, { recursive: true });
    await (0, promises_1.mkdir)(startableAvdDir, { recursive: true });
    await (0, promises_1.writeFile)(emulatorBinary, '', 'utf-8');
    await (0, promises_1.writeFile)(avdManagerBinary, '', 'utf-8');
    await (0, promises_1.writeFile)(node_path_1.default.join(runningAvdDir, 'config.ini'), ['avd.ini.displayname=Pixel 8', 'image.sysdir.1=system-images/android-34/google_apis/x86_64/'].join('\n'), 'utf-8');
    await (0, promises_1.writeFile)(node_path_1.default.join(startableAvdDir, 'config.ini'), ['avd.ini.displayname=Pixel 7', 'image.sysdir.1=system-images/android-33/google_apis/x86_64/'].join('\n'), 'utf-8');
    const discoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService({
        env: {
            NODE_ENV: 'test',
            ANDROID_HOME: sdkDir,
            ANDROID_AVD_HOME: avdHome,
        },
        execFileFn: async (file, args) => {
            if (file === '/platform-tools/adb' && args[0] === 'devices') {
                return {
                    stdout: [
                        'List of devices attached',
                        'emulator-5554 device product:sdk_gphone64_arm64 model:Pixel_8 device:emu64xa',
                        '',
                    ].join('\n'),
                    stderr: '',
                };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.build.version.sdk')) {
                return { stdout: '34\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.build.version.release')) {
                return { stdout: '14\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.product.model')) {
                return { stdout: 'Pixel 8\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.kernel.qemu')) {
                return { stdout: '1\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args[2] === 'emu') {
                return { stdout: 'Pixel_8_API_34\nOK\n', stderr: '' };
            }
            if (file === emulatorBinary && args[0] === '-list-avds') {
                return { stdout: 'Pixel_8_API_34\nPixel_7_API_33\n', stderr: '' };
            }
            if (file === avdManagerBinary && args[0] === 'list') {
                return {
                    stdout: [
                        'Name: Pixel_8_API_34',
                        `Path: ${runningAvdDir}`,
                        '',
                        'Name: Pixel_7_API_33',
                        `Path: ${startableAvdDir}`,
                        '',
                    ].join('\n'),
                    stderr: '',
                };
            }
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
        },
    });
    try {
        const inventory = await discoveryService.detectInventory('/platform-tools/adb');
        const startableEntries = inventory.entries.filter((entry) => entry.startable);
        strict_1.default.equal(startableEntries.length, 1);
        strict_1.default.equal(startableEntries[0]?.selectionId, 'android-avd:Pixel_7_API_33');
        strict_1.default.equal(startableEntries[0]?.displayName, 'Pixel 7 - Android API 33 - Pixel_7_API_33');
    }
    finally {
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('DeviceDiscoveryService keeps booted, shutdown, and unavailable iOS simulators while ignoring non-iOS runtimes', async () => {
    const discoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService({
        execFileFn: async (file, args) => {
            if (file === '/platform-tools/adb' && args[0] === 'devices') {
                return { stdout: 'List of devices attached\n', stderr: '' };
            }
            if (file === 'which' && args[0] === 'emulator') {
                throw Object.assign(new Error('missing emulator'), { code: 1, stdout: '', stderr: '' });
            }
            if (file === 'xcrun' && args[0] === 'simctl') {
                return {
                    stdout: JSON.stringify({
                        devices: {
                            'com.apple.CoreSimulator.SimRuntime.iOS-17-5': [
                                {
                                    state: 'Booted',
                                    isAvailable: true,
                                    name: 'iPhone 15 Pro',
                                    udid: 'BOOTED-DEVICE-1',
                                },
                                {
                                    state: 'Shutdown',
                                    isAvailable: true,
                                    name: 'iPhone 15',
                                    udid: 'SHUTDOWN-DEVICE-1',
                                },
                            ],
                            'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
                                {
                                    state: 'Booted',
                                    isAvailable: false,
                                    name: 'Unavailable Simulator',
                                    udid: 'UNAVAILABLE-DEVICE',
                                },
                            ],
                            'com.apple.CoreSimulator.SimRuntime.watchOS-10-0': [
                                {
                                    state: 'Booted',
                                    isAvailable: true,
                                    name: 'Apple Watch',
                                    udid: 'WATCH-1',
                                },
                            ],
                        },
                    }),
                    stderr: '',
                };
            }
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
        },
    });
    const inventory = await discoveryService.detectInventory('/platform-tools/adb');
    const iosEntries = inventory.entries.filter((entry) => entry.platform === 'ios');
    strict_1.default.equal(iosEntries.length, 3);
    strict_1.default.equal(iosEntries[0]?.displayName, 'iPhone 15 Pro - iOS 17.5 - BOOTED-DEVICE-1');
    strict_1.default.equal(iosEntries[1]?.displayName, 'iPhone 15 - iOS 17.5 - SHUTDOWN-DEVICE-1');
    strict_1.default.equal(iosEntries[2]?.displayName, 'Unavailable Simulator - iOS 18.0 - UNAVAILABLE-DEVICE');
    strict_1.default.equal(iosEntries[2]?.state, 'unavailable');
    strict_1.default.equal(iosEntries[2]?.stateDetail, 'simulator unavailable');
});
(0, node_test_1.default)('DeviceDiscoveryService startTarget boots a shutdown iOS simulator and waits until it is runnable', async () => {
    let listCalls = 0;
    const shutdownEntry = {
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
    const discoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService({
        delayFn: async () => { },
        execFileFn: async (file, args) => {
            if (file === 'xcrun' && args[0] === 'simctl' && args[1] === 'boot') {
                return { stdout: '', stderr: '' };
            }
            if (file === 'xcrun' && args[0] === 'simctl' && args[1] === 'list') {
                listCalls += 1;
                return {
                    stdout: JSON.stringify({
                        devices: {
                            'com.apple.CoreSimulator.SimRuntime.iOS-17-5': [
                                {
                                    state: listCalls === 1 ? 'Shutdown' : 'Booted',
                                    isAvailable: true,
                                    name: 'iPhone 15',
                                    udid: 'SHUTDOWN-DEVICE-1',
                                },
                            ],
                        },
                    }),
                    stderr: '',
                };
            }
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
        },
    });
    const diagnostic = await discoveryService.startTarget(shutdownEntry, '/platform-tools/adb');
    strict_1.default.equal(diagnostic, null);
    strict_1.default.equal(listCalls >= 2, true);
});
(0, node_test_1.default)('DeviceDiscoveryService startTarget launches an Android emulator and waits for boot completion', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-android-start-'));
    const sdkDir = node_path_1.default.join(tempDir, 'sdk');
    const emulatorBinary = node_path_1.default.join(sdkDir, 'emulator', 'emulator');
    await (0, promises_1.mkdir)(node_path_1.default.dirname(emulatorBinary), { recursive: true });
    await (0, promises_1.writeFile)(emulatorBinary, '', 'utf-8');
    const shutdownEntry = {
        selectionId: 'android-avd:Pixel_8_API_34',
        platform: 'android',
        targetKind: 'android-emulator',
        state: 'shutdown',
        runnable: false,
        startable: true,
        displayName: 'Pixel 8 - Android API 34 - Pixel_8_API_34',
        rawId: 'Pixel_8_API_34',
        modelName: 'Pixel 8',
        osVersionLabel: 'Android API 34',
        deviceInfo: null,
        transcripts: [],
    };
    const child = new FakeChildProcess();
    const spawnCalls = [];
    const discoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService({
        env: {
            NODE_ENV: 'test',
            ANDROID_HOME: sdkDir,
        },
        delayFn: async () => { },
        spawnFn: ((command, args) => {
            spawnCalls.push({ command, args: args ?? [] });
            return child;
        }),
        execFileFn: async (file, args) => {
            if (file === '/platform-tools/adb' && args[0] === 'devices') {
                return {
                    stdout: [
                        'List of devices attached',
                        'emulator-5554 device product:sdk_gphone64_arm64 model:Pixel_8 device:emu64xa',
                        '',
                    ].join('\n'),
                    stderr: '',
                };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.build.version.sdk')) {
                return { stdout: '34\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.build.version.release')) {
                return { stdout: '14\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.product.model')) {
                return { stdout: 'Pixel 8\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('ro.kernel.qemu')) {
                return { stdout: '1\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args[2] === 'emu') {
                return { stdout: 'Pixel_8_API_34\nOK\n', stderr: '' };
            }
            if (file === '/platform-tools/adb' && args.includes('sys.boot_completed')) {
                return { stdout: '1\n', stderr: '' };
            }
            throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
        },
    });
    try {
        const diagnostic = await discoveryService.startTarget(shutdownEntry, '/platform-tools/adb');
        strict_1.default.equal(diagnostic, null);
        strict_1.default.deepEqual(spawnCalls, [
            {
                command: emulatorBinary,
                args: ['-avd', 'Pixel_8_API_34', '-netdelay', 'none', '-netspeed', 'full'],
            },
        ]);
    }
    finally {
        await (0, promises_1.rm)(tempDir, { recursive: true, force: true });
    }
});
//# sourceMappingURL=DeviceDiscoveryService.test.js.map