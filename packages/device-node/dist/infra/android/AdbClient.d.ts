import { type SingleArgument } from '@usb-ui-test/common';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
export interface AndroidSwipeParams {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    durationMs: number;
}
export interface AndroidCommandResult {
    success: boolean;
    message?: string;
    stdout?: string;
    stderr?: string;
    data?: Record<string, unknown>;
}
export declare const ANDROID_DRIVER_APP_PACKAGE_NAME = "app.usbuitest.driver";
export declare const ANDROID_DRIVER_TEST_PACKAGE_NAME = "app.usbuitest.driver.test";
/**
 * True when `pm grant` / `pm revoke` failed because the target package does not declare the
 * permission in its manifest (`Package … has not requested permission …`). Used for best-effort
 * `allowAllPermissions` (still defaulted true) so undeclared permissions are skipped, not errors.
 */
export declare function isUndeclaredPermissionGrantFailure(stderrOrMessage: string): boolean;
export declare class AdbClient {
    /** deviceSerial -> port currently allocated for that device */
    private _portMap;
    /** ports currently in use across all devices (set of allocated values) */
    private _allocatedPorts;
    /**
     * Async mutex serializing port allocate/release/cleanup. Without this,
     * two concurrent forwardPort() calls can both pass _isPortBindable() for
     * the same port and both reserve it.
     */
    private _allocationMutex;
    private _execFileFn;
    constructor(params?: {
        execFileFn?: ExecFileFn;
    });
    /**
     * Run `fn` while holding the allocation mutex. Ensures only one
     * allocate/release/cleanup runs at a time across all callers.
     */
    private _withAllocationLock;
    /**
     * Set up the host->device port forward and return the allocated host port.
     *
     * The same port is used on BOTH sides of the forward (`tcp:N -> tcp:N`)
     * so the driver app's `-e port N` argument lines up with the forward
     * destination. The `devicePort` argument is ignored and kept for backwards
     * compatibility — earlier versions hardcoded it to DEFAULT_GRPC_PORT_START
     * which caused host/device port drift across runs.
     */
    forwardPort(adbPath: string, deviceSerial: string, _devicePort?: number): Promise<number>;
    removePortForward(adbPath: string, deviceSerial: string): Promise<void>;
    /**
     * Nuke every adb forward across all attached devices. Call this on process
     * startup to clean up stale forwards left behind by a previous crashed
     * device-node process.
     */
    removeAllPortForwards(adbPath: string): Promise<void>;
    getForwardedPort(deviceSerial: string): number | undefined;
    installApp(adbPath: string, deviceSerial: string, apkPath: string): Promise<boolean>;
    /**
     * Install a test APK (androidTest variant). Uses `-t` in addition to the
     * standard flags so the package manager registers the instrumentation entry.
     * Without `-t`, `am instrument` fails with "Unable to find instrumentation
     * info" on Android 10+ even though the APK bytes are present on disk.
     */
    installTestApp(adbPath: string, deviceSerial: string, apkPath: string): Promise<boolean>;
    uninstallApp(adbPath: string, deviceSerial: string, packageName: string): Promise<void>;
    openDeepLink(adbPath: string, deviceSerial: string, deeplink: string): Promise<boolean>;
    swipe(adbPath: string, deviceSerial: string, params: AndroidSwipeParams): Promise<AndroidCommandResult>;
    runCommand(adbPath: string, deviceSerial: string, command: string): Promise<AndroidCommandResult>;
    isKeyboardOpen(adbPath: string, deviceSerial: string): Promise<AndroidCommandResult>;
    hideKeyboard(adbPath: string, deviceSerial: string): Promise<AndroidCommandResult>;
    clearAppData(adbPath: string, deviceSerial: string, packageName: string): Promise<AndroidCommandResult>;
    forceStop(adbPath: string, deviceSerial: string, packageName: string, options?: {
        suppressErrorLog?: boolean;
    }): Promise<AndroidCommandResult>;
    /**
     * Best-effort check for whether a package has any live process on the
     * device. Uses `pidof <pkg>`; behaviour across Android versions varies
     * (empty stdout vs. non-zero exit when no match), so "any signal that
     * something is still running" is treated as running. Errors are treated as
     * not-running so teardown pollers don't hang on a disconnected device.
     */
    isProcessRunning(adbPath: string, deviceSerial: string, packageName: string): Promise<boolean>;
    performKeyPress(adbPath: string, deviceSerial: string, key: string): Promise<AndroidCommandResult>;
    back(adbPath: string, deviceSerial: string): Promise<AndroidCommandResult>;
    home(adbPath: string, deviceSerial: string): Promise<AndroidCommandResult>;
    rotate(adbPath: string, deviceSerial: string): Promise<AndroidCommandResult>;
    bringAppToForeground(adbPath: string, deviceSerial: string, packageName: string): Promise<AndroidCommandResult>;
    launchAppCli(adbPath: string, deviceSerial: string, packageName: string, argumentsMap?: Record<string, SingleArgument>): Promise<AndroidCommandResult>;
    listInstalledPackageIds(adbPath: string, deviceSerial: string, options?: {
        userOnly?: boolean;
    }): Promise<string[]>;
    isPackageInstalled(adbPath: string, deviceSerial: string, packageName: string): Promise<AndroidCommandResult>;
    isAirplaneModeOn(adbPath: string, deviceSerial: string): Promise<boolean>;
    toggleAirplaneMode(adbPath: string, deviceSerial: string, enabled: boolean, sdkVersion?: string | number | null): Promise<AndroidCommandResult>;
    toggleInternet(adbPath: string, deviceSerial: string, enable: boolean, sdkVersion?: string | number | null): Promise<AndroidCommandResult>;
    allowAllPermissions(adbPath: string, deviceSerial: string, packageName: string): Promise<AndroidCommandResult>;
    togglePermissions(adbPath: string, deviceSerial: string, packageName: string, permissions: Record<string, string>): Promise<AndroidCommandResult>;
    toggleDisableBatteryOptimization(adbPath: string, deviceSerial: string, packageName: string, disableOptimization: boolean): Promise<AndroidCommandResult>;
    performMockLocation(adbPath: string, deviceSerial: string, driverPackageName?: string): Promise<AndroidCommandResult>;
    performGeoFix(adbPath: string, deviceSerial: string, latitude: number, longitude: number): Promise<AndroidCommandResult>;
    /**
     * Pick the lowest free port in [PORT_RANGE_START, PORT_RANGE_END) that is
     * BOTH not currently assigned to a known device AND actually bindable on
     * the host.
     *
     * Serialized via the allocation mutex so concurrent forwardPort() calls
     * can't both observe the same port as free between the bindability probe
     * and the reservation.
     */
    private _allocatePort;
    /** Return a port to the pool. Called from removePortForward. */
    private _releasePort;
    /**
     * Probe whether the host kernel can actually bind this port right now.
     * If anything else on the host is squatting on it, skip and try the next.
     */
    private _isPortBindable;
    private _runAdb;
    private _toFailureResult;
    private _normalizeKeyName;
    private _translatePermissionName;
    private _toggleSystemAlertWindowPermission;
}
export {};
//# sourceMappingURL=AdbClient.d.ts.map