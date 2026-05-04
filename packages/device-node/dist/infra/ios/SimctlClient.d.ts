import { spawn } from 'child_process';
import { DeviceAppInfo, type SingleArgument } from '@usb-ui-test/common';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
export declare const IOS_DRIVER_RUNNER_BUNDLE_ID = "app.usbuitest.iosUITests.xctrunner";
export interface IOSDriverProcessHandle {
    pid?: number;
    exitCode?: number | null;
    killed?: boolean;
    stdout?: NodeJS.ReadableStream | null;
    stderr?: NodeJS.ReadableStream | null;
    on(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
}
export interface IOSCommandResult {
    success: boolean;
    message?: string;
    stdout?: string;
    stderr?: string;
    data?: Record<string, unknown>;
}
export declare class SimctlClient {
    private _execFileFn;
    private _spawnFn;
    constructor(params?: {
        execFileFn?: ExecFileFn;
        spawnFn?: typeof spawn;
    });
    installApp(deviceId: string, appPath: string): Promise<boolean>;
    uninstallApp(deviceId: string, bundleId: string): Promise<IOSCommandResult>;
    openUrl(deviceId: string, deeplink: string): Promise<boolean>;
    terminateAppResult(deviceId: string, bundleId: string): Promise<IOSCommandResult>;
    terminateApp(deviceId: string, bundleId: string): Promise<void>;
    launchApp(deviceId: string, bundleId: string, argumentsMap?: Record<string, SingleArgument>): Promise<IOSCommandResult>;
    bringAppToForeground(deviceId: string, bundleId: string, argumentsMap?: Record<string, SingleArgument>): Promise<IOSCommandResult>;
    setLocation(deviceId: string, latitude: string, longitude: string): Promise<IOSCommandResult>;
    clearLocation(deviceId: string): Promise<IOSCommandResult>;
    pressButton(deviceId: string, button: string): Promise<IOSCommandResult>;
    allowAllPermissions(deviceId: string, bundleId: string): Promise<IOSCommandResult>;
    togglePermissions(deviceId: string, bundleId: string, permissions: Record<string, string>): Promise<IOSCommandResult>;
    isApplesimutilsInstalled(): Promise<boolean>;
    clearClipboard(deviceId: string): Promise<IOSCommandResult>;
    clearSafariData(deviceId: string): Promise<IOSCommandResult>;
    resetAllPermissions(deviceId: string): Promise<IOSCommandResult>;
    uninstallUserApps(deviceId: string): Promise<IOSCommandResult>;
    listInstalledApps(deviceId: string): Promise<DeviceAppInfo[]>;
    listInstalledAppIds(deviceId: string): Promise<string[]>;
    getAppExecutableName(deviceId: string, bundleId: string): Promise<string | null>;
    startDriver(deviceId: string, port: number): IOSDriverProcessHandle;
    private _listInstalledAppMetadata;
    private _applySimctlPermissions;
    private _applyApplesimutilsPermissions;
    private _mergePermissionResults;
    private _runCommand;
    private _toFailureResult;
    private _normalizeButtonName;
}
export {};
//# sourceMappingURL=SimctlClient.d.ts.map