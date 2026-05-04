"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdbClient = exports.ANDROID_DRIVER_TEST_PACKAGE_NAME = exports.ANDROID_DRIVER_APP_PACKAGE_NAME = void 0;
exports.isUndeclaredPermissionGrantFailure = isUndeclaredPermissionGrantFailure;
const child_process_1 = require("child_process");
const util_1 = require("util");
const net = __importStar(require("node:net"));
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Range of host ports the AdbClient is allowed to use for the gRPC driver
 * forward. Each device gets one port from this pool, used as both the
 * host-side and device-side port (forward target = forward source).
 *
 * 100 slots starting from DEFAULT_GRPC_PORT_START.
 */
const PORT_RANGE_START = common_1.DEFAULT_GRPC_PORT_START;
const PORT_RANGE_END = PORT_RANGE_START + 100;
exports.ANDROID_DRIVER_APP_PACKAGE_NAME = 'app.usbuitest.driver';
exports.ANDROID_DRIVER_TEST_PACKAGE_NAME = 'app.usbuitest.driver.test';
const ANDROID_KEY_CODES = {
    enter: 'KEYCODE_ENTER',
    return: 'KEYCODE_ENTER',
    backspace: 'KEYCODE_DEL',
    delete: 'KEYCODE_DEL',
    back: 'KEYCODE_BACK',
    home: 'KEYCODE_HOME',
    lock: 'KEYCODE_LOCK',
    power: 'KEYCODE_POWER',
    volume_up: 'KEYCODE_VOLUME_UP',
    volumeup: 'KEYCODE_VOLUME_UP',
    volume_down: 'KEYCODE_VOLUME_DOWN',
    volumedown: 'KEYCODE_VOLUME_DOWN',
    escape: 'KEYCODE_ESCAPE',
    esc: 'KEYCODE_ESCAPE',
    tab: 'KEYCODE_TAB',
    up: 'KEYCODE_DPAD_UP',
    down: 'KEYCODE_DPAD_DOWN',
    left: 'KEYCODE_DPAD_LEFT',
    right: 'KEYCODE_DPAD_RIGHT',
    center: 'KEYCODE_DPAD_CENTER',
    play_pause: 'KEYCODE_MEDIA_PLAY_PAUSE',
    stop: 'KEYCODE_MEDIA_STOP',
    next: 'KEYCODE_MEDIA_NEXT',
    previous: 'KEYCODE_MEDIA_PREVIOUS',
    rewind: 'KEYCODE_MEDIA_REWIND',
    fast_forward: 'KEYCODE_MEDIA_FAST_FORWARD',
    menu: 'KEYCODE_MENU',
};
const ANDROID_PERMISSION_TRANSLATIONS = {
    location: [
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
    ],
    camera: ['android.permission.CAMERA'],
    contacts: [
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
    ],
    phone: [
        'android.permission.CALL_PHONE',
        'android.permission.ANSWER_PHONE_CALLS',
    ],
    microphone: ['android.permission.RECORD_AUDIO'],
    bluetooth: [
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_SCAN',
    ],
    storage: [
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
    ],
    notifications: ['android.permission.POST_NOTIFICATIONS'],
    medialibrary: [
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
    ],
    calendar: [
        'android.permission.WRITE_CALENDAR',
        'android.permission.READ_CALENDAR',
    ],
    sms: [
        'android.permission.READ_SMS',
        'android.permission.RECEIVE_SMS',
        'android.permission.SEND_SMS',
    ],
    overlay: ['SYSTEM_ALERT_WINDOW'],
};
/**
 * True when `pm grant` / `pm revoke` failed because the target package does not declare the
 * permission in its manifest (`Package … has not requested permission …`). Used for best-effort
 * `allowAllPermissions` (still defaulted true) so undeclared permissions are skipped, not errors.
 */
function isUndeclaredPermissionGrantFailure(stderrOrMessage) {
    return stderrOrMessage.toLowerCase().includes('has not requested permission');
}
class AdbClient {
    /** deviceSerial -> port currently allocated for that device */
    _portMap = new Map();
    /** ports currently in use across all devices (set of allocated values) */
    _allocatedPorts = new Set();
    /**
     * Async mutex serializing port allocate/release/cleanup. Without this,
     * two concurrent forwardPort() calls can both pass _isPortBindable() for
     * the same port and both reserve it.
     */
    _allocationMutex = Promise.resolve();
    _execFileFn;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
    }
    /**
     * Run `fn` while holding the allocation mutex. Ensures only one
     * allocate/release/cleanup runs at a time across all callers.
     */
    async _withAllocationLock(fn) {
        const previous = this._allocationMutex;
        let releaseLock;
        this._allocationMutex = new Promise((resolve) => {
            releaseLock = resolve;
        });
        try {
            await previous;
            return await fn();
        }
        finally {
            releaseLock();
        }
    }
    /**
     * Set up the host->device port forward and return the allocated host port.
     *
     * The same port is used on BOTH sides of the forward (`tcp:N -> tcp:N`)
     * so the driver app's `-e port N` argument lines up with the forward
     * destination. The `devicePort` argument is ignored and kept for backwards
     * compatibility — earlier versions hardcoded it to DEFAULT_GRPC_PORT_START
     * which caused host/device port drift across runs.
     */
    async forwardPort(adbPath, deviceSerial, _devicePort) {
        const localPort = await this._allocatePort(deviceSerial);
        try {
            await this._execFileFn(adbPath, [
                '-s',
                deviceSerial,
                'forward',
                `tcp:${localPort}`,
                `tcp:${localPort}`,
            ]);
        }
        catch (error) {
            // adb forward failed — return the reservation to the pool so the
            // port can be reused. The caller will see the rethrown error.
            await this._releasePort(deviceSerial);
            throw error;
        }
        common_1.Logger.d(`Port forwarded: localhost:${localPort} -> ${deviceSerial}:${localPort}`);
        return localPort;
    }
    async removePortForward(adbPath, deviceSerial) {
        const port = this._portMap.get(deviceSerial);
        if (port === undefined) {
            return;
        }
        try {
            await this._execFileFn(adbPath, [
                '-s',
                deviceSerial,
                'forward',
                '--remove',
                `tcp:${port}`,
            ]);
        }
        catch {
            // Ignore best-effort cleanup failures.
        }
        await this._releasePort(deviceSerial);
    }
    /**
     * Nuke every adb forward across all attached devices. Call this on process
     * startup to clean up stale forwards left behind by a previous crashed
     * device-node process.
     */
    async removeAllPortForwards(adbPath) {
        try {
            await this._execFileFn(adbPath, ['forward', '--remove-all']);
            common_1.Logger.d('Removed all stale adb forwards');
        }
        catch (error) {
            // "no devices/emulators found" is expected at cold startup — adb
            // requires a target device for `forward --remove-all`. Anything else
            // is unusual but still best-effort.
            const message = error instanceof Error ? error.message : String(error);
            if (!/no devices\/emulators found/i.test(message)) {
                common_1.Logger.w('Failed to remove all adb forwards (ignoring)', error);
            }
        }
        // Reset in-memory pool too — the OS state was just wiped (or there's
        // nothing to reset because no devices are attached). Take the lock so
        // this can't race with an in-flight allocation.
        await this._withAllocationLock(async () => {
            this._portMap.clear();
            this._allocatedPorts.clear();
        });
    }
    getForwardedPort(deviceSerial) {
        return this._portMap.get(deviceSerial);
    }
    async installApp(adbPath, deviceSerial, apkPath) {
        const result = await this._runAdb(adbPath, ['-s', deviceSerial, 'install', '-r', '-g', apkPath], `Failed to install APK on ${deviceSerial}`);
        if (result.success) {
            common_1.Logger.i(`Installed APK on ${deviceSerial}: ${apkPath}`);
        }
        return result.success;
    }
    /**
     * Install a test APK (androidTest variant). Uses `-t` in addition to the
     * standard flags so the package manager registers the instrumentation entry.
     * Without `-t`, `am instrument` fails with "Unable to find instrumentation
     * info" on Android 10+ even though the APK bytes are present on disk.
     */
    async installTestApp(adbPath, deviceSerial, apkPath) {
        const result = await this._runAdb(adbPath, ['-s', deviceSerial, 'install', '-r', '-g', '-t', apkPath], `Failed to install test runner APK on ${deviceSerial}`);
        if (result.success) {
            common_1.Logger.i(`Installed APK on ${deviceSerial}: ${apkPath}`);
        }
        return result.success;
    }
    async uninstallApp(adbPath, deviceSerial, packageName) {
        await this._runAdb(adbPath, ['-s', deviceSerial, 'uninstall', packageName], `Failed to uninstall ${packageName} on ${deviceSerial}`, { suppressErrorLog: true });
    }
    async openDeepLink(adbPath, deviceSerial, deeplink) {
        const result = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'am',
            'start',
            '-W',
            '-a',
            'android.intent.action.VIEW',
            '-d',
            deeplink,
        ], `Failed to open Android deeplink on ${deviceSerial}`);
        if (result.success) {
            common_1.Logger.i(`Opened Android deeplink on ${deviceSerial}: ${deeplink}`);
        }
        return result.success;
    }
    async swipe(adbPath, deviceSerial, params) {
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'input',
            'swipe',
            String(params.startX),
            String(params.startY),
            String(params.endX),
            String(params.endY),
            String(params.durationMs),
        ], `Android swipe failed on ${deviceSerial}`);
    }
    async runCommand(adbPath, deviceSerial, command) {
        const parts = command.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return {
                success: false,
                message: 'Android command failed: command was empty',
            };
        }
        return await this._runAdb(adbPath, ['-s', deviceSerial, ...parts], `Android command failed on ${deviceSerial}`);
    }
    async isKeyboardOpen(adbPath, deviceSerial) {
        const result = await this._runAdb(adbPath, ['-s', deviceSerial, 'shell', 'dumpsys', 'input_method'], `Failed to inspect keyboard state on ${deviceSerial}`);
        if (!result.success) {
            return result;
        }
        const visible = (result.stdout ?? '').includes('mInputShown=true');
        return {
            success: visible,
            message: visible ? 'Keyboard is visible' : 'Keyboard is hidden',
            stdout: result.stdout,
            stderr: result.stderr,
            data: { visible },
        };
    }
    async hideKeyboard(adbPath, deviceSerial) {
        const keyboardState = await this.isKeyboardOpen(adbPath, deviceSerial);
        if (keyboardState.data?.['visible'] !== true) {
            return {
                success: true,
                message: 'Keyboard is already hidden',
            };
        }
        return await this.performKeyPress(adbPath, deviceSerial, 'back');
    }
    async clearAppData(adbPath, deviceSerial, packageName) {
        return await this._runAdb(adbPath, ['-s', deviceSerial, 'shell', 'pm', 'clear', packageName], `Failed to clear app data for ${packageName} on ${deviceSerial}`);
    }
    async forceStop(adbPath, deviceSerial, packageName, options) {
        return await this._runAdb(adbPath, ['-s', deviceSerial, 'shell', 'am', 'force-stop', packageName], `Failed to force-stop ${packageName} on ${deviceSerial}`, { suppressErrorLog: options?.suppressErrorLog });
    }
    /**
     * Best-effort check for whether a package has any live process on the
     * device. Uses `pidof <pkg>`; behaviour across Android versions varies
     * (empty stdout vs. non-zero exit when no match), so "any signal that
     * something is still running" is treated as running. Errors are treated as
     * not-running so teardown pollers don't hang on a disconnected device.
     */
    async isProcessRunning(adbPath, deviceSerial, packageName) {
        const result = await this._runAdb(adbPath, ['-s', deviceSerial, 'shell', 'pidof', packageName], `Failed to check process for ${packageName} on ${deviceSerial}`, { suppressErrorLog: true });
        return result.success && !!result.stdout && result.stdout.length > 0;
    }
    async performKeyPress(adbPath, deviceSerial, key) {
        const normalizedKey = this._normalizeKeyName(key);
        const adbKey = ANDROID_KEY_CODES[normalizedKey];
        if (!adbKey) {
            return {
                success: false,
                message: `Android key is not mapped for adb: ${key}`,
                data: { handled: false },
            };
        }
        const result = await this._runAdb(adbPath, ['-s', deviceSerial, 'shell', 'input', 'keyevent', adbKey], `Failed to press Android key ${key} on ${deviceSerial}`);
        return {
            ...result,
            data: { handled: true },
        };
    }
    async back(adbPath, deviceSerial) {
        return await this.performKeyPress(adbPath, deviceSerial, 'back');
    }
    async home(adbPath, deviceSerial) {
        return await this.performKeyPress(adbPath, deviceSerial, 'home');
    }
    async rotate(adbPath, deviceSerial) {
        const currentRotation = await this._runAdb(adbPath, ['-s', deviceSerial, 'shell', 'settings', 'get', 'system', 'user_rotation'], `Failed to read Android rotation on ${deviceSerial}`);
        if (!currentRotation.success) {
            return currentRotation;
        }
        const current = Number.parseInt((currentRotation.stdout ?? '').trim(), 10);
        const nextRotation = current === 1 || current === 3 ? 0 : 1;
        const orientation = nextRotation === 0 ? 'portrait' : 'landscape';
        const disableAutoRotate = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'settings',
            'put',
            'system',
            'accelerometer_rotation',
            '0',
        ], `Failed to disable Android auto-rotate on ${deviceSerial}`);
        if (!disableAutoRotate.success) {
            return disableAutoRotate;
        }
        const result = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'settings',
            'put',
            'system',
            'user_rotation',
            String(nextRotation),
        ], `Failed to rotate Android device ${deviceSerial}`);
        return {
            ...result,
            data: {
                orientation,
            },
        };
    }
    async bringAppToForeground(adbPath, deviceSerial, packageName) {
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'monkey',
            '-p',
            packageName,
            '-c',
            'android.intent.category.LAUNCHER',
            '1',
        ], `Failed to foreground ${packageName} on ${deviceSerial}`);
    }
    async launchAppCli(adbPath, deviceSerial, packageName, argumentsMap) {
        const resolveResult = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'cmd',
            'package',
            'resolve-activity',
            '--brief',
            packageName,
            '-c',
            'android.intent.category.LAUNCHER',
        ], `Failed to resolve Android launcher activity for ${packageName} on ${deviceSerial}`);
        if (!resolveResult.success) {
            return resolveResult;
        }
        const component = (resolveResult.stdout ?? '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .at(-1);
        if (!component) {
            return {
                success: false,
                message: `Failed to resolve launcher component for ${packageName}`,
            };
        }
        const args = [
            '-s',
            deviceSerial,
            'shell',
            'am',
            'start',
            '-W',
            '-n',
            component,
        ];
        for (const [argumentKey, argumentValue] of Object.entries(argumentsMap ?? {})) {
            args.push('-e', argumentValue.key || argumentKey, argumentValue.value);
        }
        return await this._runAdb(adbPath, args, `Failed to launch ${packageName} on ${deviceSerial}`);
    }
    async listInstalledPackageIds(adbPath, deviceSerial, options) {
        const result = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'pm',
            'list',
            'packages',
            ...(options?.userOnly ? ['-3'] : []),
        ], `Failed to list Android packages on ${deviceSerial}`);
        if (!result.success) {
            return [];
        }
        return (result.stdout ?? '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.replace(/^package:/, ''))
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right));
    }
    async isPackageInstalled(adbPath, deviceSerial, packageName) {
        const packages = await this.listInstalledPackageIds(adbPath, deviceSerial);
        const installed = packages.includes(packageName);
        return {
            success: installed,
            message: installed
                ? `App installed: ${packageName}`
                : `App not installed: ${packageName}`,
            data: {
                packageName,
                installed,
            },
        };
    }
    async isAirplaneModeOn(adbPath, deviceSerial) {
        const result = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'settings',
            'get',
            'global',
            'airplane_mode_on',
        ], `Failed to read airplane mode state on ${deviceSerial}`, { suppressErrorLog: true });
        return (result.stdout ?? '').trim() === '1';
    }
    async toggleAirplaneMode(adbPath, deviceSerial, enabled, sdkVersion) {
        const parsedApiLevel = typeof sdkVersion === 'number'
            ? sdkVersion
            : typeof sdkVersion === 'string'
                ? Number.parseInt(sdkVersion, 10)
                : Number.NaN;
        if (Number.isFinite(parsedApiLevel) && parsedApiLevel < 29) {
            const stateResult = await this._runAdb(adbPath, [
                '-s',
                deviceSerial,
                'shell',
                'settings',
                'put',
                'global',
                'airplane_mode_on',
                enabled ? '1' : '0',
            ], `Failed to set airplane mode state on ${deviceSerial}`);
            if (!stateResult.success) {
                return stateResult;
            }
            return await this._runAdb(adbPath, [
                '-s',
                deviceSerial,
                'shell',
                'am',
                'broadcast',
                '-a',
                'android.intent.action.AIRPLANE_MODE',
                '--ez',
                'state',
                enabled ? 'true' : 'false',
            ], `Failed to broadcast airplane mode change on ${deviceSerial}`);
        }
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'cmd',
            'connectivity',
            'airplane-mode',
            enabled ? 'enable' : 'disable',
        ], `Failed to toggle airplane mode on ${deviceSerial}`);
    }
    async toggleInternet(adbPath, deviceSerial, enable, sdkVersion) {
        if (enable && (await this.isAirplaneModeOn(adbPath, deviceSerial))) {
            const airplaneResult = await this.toggleAirplaneMode(adbPath, deviceSerial, false, sdkVersion);
            if (!airplaneResult.success) {
                return airplaneResult;
            }
        }
        const wifiResult = await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'svc',
            'wifi',
            enable ? 'enable' : 'disable',
        ], `Failed to toggle Wi-Fi on ${deviceSerial}`);
        if (!wifiResult.success) {
            return wifiResult;
        }
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'svc',
            'data',
            enable ? 'enable' : 'disable',
        ], `Failed to toggle mobile data on ${deviceSerial}`);
    }
    async allowAllPermissions(adbPath, deviceSerial, packageName) {
        const permissions = Object.fromEntries(Object.keys(ANDROID_PERMISSION_TRANSLATIONS).map((permission) => [
            permission,
            'allow',
        ]));
        return await this.togglePermissions(adbPath, deviceSerial, packageName, permissions);
    }
    async togglePermissions(adbPath, deviceSerial, packageName, permissions) {
        const errors = [];
        let skippedUndeclaredRuntime = 0;
        for (const [permissionName, action] of Object.entries(permissions)) {
            const translatedPermissions = this._translatePermissionName(permissionName);
            if (translatedPermissions.length === 0) {
                errors.push(`Unknown permission: ${permissionName}`);
                continue;
            }
            for (const androidPermission of translatedPermissions) {
                let result;
                if (androidPermission === 'SYSTEM_ALERT_WINDOW') {
                    result = await this._toggleSystemAlertWindowPermission(adbPath, deviceSerial, packageName, action);
                    if (!result.success) {
                        errors.push(`Failed to update ${androidPermission}: ${result.message ?? 'unknown error'}`);
                    }
                }
                else {
                    const adbAction = action === 'allow' ? 'grant' : 'revoke';
                    const failurePrefix = `Failed to ${adbAction} ${androidPermission} on ${deviceSerial}`;
                    result = await this._runAdb(adbPath, [
                        '-s',
                        deviceSerial,
                        'shell',
                        'pm',
                        adbAction,
                        packageName,
                        androidPermission,
                    ], failurePrefix, { suppressErrorLog: true });
                    if (!result.success) {
                        const textForMatch = `${result.stderr ?? ''}\n${result.message ?? ''}`;
                        if (isUndeclaredPermissionGrantFailure(textForMatch)) {
                            skippedUndeclaredRuntime += 1;
                        }
                        else {
                            common_1.Logger.e(failurePrefix, new Error(result.message ?? 'unknown error'));
                            errors.push(`Failed to update ${androidPermission}: ${result.message ?? 'unknown error'}`);
                        }
                    }
                }
            }
        }
        if (skippedUndeclaredRuntime > 0) {
            common_1.Logger.i(`Skipped ${skippedUndeclaredRuntime} Android runtime permission(s) not declared by ${packageName} on ${deviceSerial}`);
        }
        return {
            success: errors.length === 0,
            message: errors.length === 0
                ? 'Permissions updated successfully'
                : errors.join('\n'),
        };
    }
    async toggleDisableBatteryOptimization(adbPath, deviceSerial, packageName, disableOptimization) {
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'dumpsys',
            'deviceidle',
            'whitelist',
            `${disableOptimization ? '+' : '-'}${packageName}`,
        ], `Failed to update battery optimization whitelist for ${packageName} on ${deviceSerial}`);
    }
    async performMockLocation(adbPath, deviceSerial, driverPackageName = exports.ANDROID_DRIVER_APP_PACKAGE_NAME) {
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'appops',
            'set',
            driverPackageName,
            'android:mock_location',
            'allow',
        ], `Failed to enable mock location on ${deviceSerial}`);
    }
    async performGeoFix(adbPath, deviceSerial, latitude, longitude) {
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'emu',
            'geo',
            'fix',
            String(longitude),
            String(latitude),
        ], `Failed to set emulator geo fix on ${deviceSerial}`);
    }
    /**
     * Pick the lowest free port in [PORT_RANGE_START, PORT_RANGE_END) that is
     * BOTH not currently assigned to a known device AND actually bindable on
     * the host.
     *
     * Serialized via the allocation mutex so concurrent forwardPort() calls
     * can't both observe the same port as free between the bindability probe
     * and the reservation.
     */
    async _allocatePort(deviceSerial) {
        return this._withAllocationLock(async () => {
            const existingPort = this._portMap.get(deviceSerial);
            if (existingPort !== undefined) {
                return existingPort;
            }
            for (let port = PORT_RANGE_START; port < PORT_RANGE_END; port++) {
                if (this._allocatedPorts.has(port))
                    continue;
                if (!(await this._isPortBindable(port)))
                    continue;
                this._allocatedPorts.add(port);
                this._portMap.set(deviceSerial, port);
                common_1.Logger.d(`Allocated port ${port} for ${deviceSerial}`);
                return port;
            }
            throw new Error(`No ports available in range ${PORT_RANGE_START}-${PORT_RANGE_END}`);
        });
    }
    /** Return a port to the pool. Called from removePortForward. */
    async _releasePort(deviceSerial) {
        await this._withAllocationLock(async () => {
            const port = this._portMap.get(deviceSerial);
            if (port === undefined)
                return;
            this._portMap.delete(deviceSerial);
            this._allocatedPorts.delete(port);
            common_1.Logger.d(`Released port ${port} for ${deviceSerial}`);
        });
    }
    /**
     * Probe whether the host kernel can actually bind this port right now.
     * If anything else on the host is squatting on it, skip and try the next.
     */
    _isPortBindable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(false));
            server.listen(port, '127.0.0.1', () => {
                server.close(() => resolve(true));
            });
        });
    }
    async _runAdb(adbPath, args, failurePrefix, options) {
        try {
            const { stdout, stderr } = await this._execFileFn(adbPath, args);
            const stdoutText = stdout.toString().trim();
            const stderrText = stderr.toString().trim();
            return {
                success: true,
                message: stderrText || stdoutText || undefined,
                stdout: stdoutText,
                stderr: stderrText,
            };
        }
        catch (error) {
            const result = this._toFailureResult(failurePrefix, error);
            if (!options?.suppressErrorLog) {
                common_1.Logger.e(failurePrefix, error);
            }
            return result;
        }
    }
    _toFailureResult(failurePrefix, error) {
        const stdout = typeof error === 'object' &&
            error !== null &&
            'stdout' in error &&
            (typeof error.stdout === 'string' ||
                Buffer.isBuffer(error.stdout))
            ? error.stdout?.toString().trim()
            : '';
        const stderr = typeof error === 'object' &&
            error !== null &&
            'stderr' in error &&
            (typeof error.stderr === 'string' ||
                Buffer.isBuffer(error.stderr))
            ? error.stderr?.toString().trim()
            : '';
        const errorMessage = stderr || stdout || (error instanceof Error ? error.message : String(error));
        return {
            success: false,
            message: `${failurePrefix}: ${errorMessage}`,
            stdout,
            stderr,
        };
    }
    _normalizeKeyName(key) {
        return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
    }
    _translatePermissionName(permissionName) {
        if (permissionName.includes('.')) {
            return [permissionName];
        }
        return ANDROID_PERMISSION_TRANSLATIONS[permissionName] ?? [];
    }
    async _toggleSystemAlertWindowPermission(adbPath, deviceSerial, packageName, action) {
        const mode = action === 'allow' ? 'allow' : action === 'unset' ? 'default' : 'deny';
        return await this._runAdb(adbPath, [
            '-s',
            deviceSerial,
            'shell',
            'appops',
            'set',
            packageName,
            'SYSTEM_ALERT_WINDOW',
            mode,
        ], `Failed to update overlay permission for ${packageName} on ${deviceSerial}`);
    }
}
exports.AdbClient = AdbClient;
//# sourceMappingURL=AdbClient.js.map