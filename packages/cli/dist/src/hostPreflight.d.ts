import { PLATFORM_ANDROID, PLATFORM_IOS, type DeviceNodeResponse } from '@usb-ui-test/common';
export type HostPreflightRequestedPlatform = typeof PLATFORM_ANDROID | typeof PLATFORM_IOS | 'all';
export type HostPreflightCheckedPlatform = typeof PLATFORM_ANDROID | typeof PLATFORM_IOS;
export type HostPreflightPlatform = HostPreflightCheckedPlatform | 'common';
export type HostPreflightStatus = 'ok' | 'error' | 'warning';
export interface HostPreflightCheck {
    platform: HostPreflightPlatform;
    status: HostPreflightStatus;
    id: string;
    title: string;
    summary: string;
    detail?: string;
    blocking: boolean;
}
export interface HostPreflightResult {
    requestedPlatforms: HostPreflightCheckedPlatform[];
    checks: HostPreflightCheck[];
}
export interface HostPreflightFilePathUtil {
    getADBPath(): Promise<string | null>;
    getDriverAppPath(): Promise<string | null>;
    getDriverTestAppPath(): Promise<string | null>;
    getResourceDir(): string;
}
export interface HostPreflightDependencies {
    createFilePathUtil(): HostPreflightFilePathUtil;
    execFile(file: string, args: readonly string[]): Promise<{
        stdout: string | Buffer;
        stderr: string | Buffer;
    }>;
    resolveCommand(command: string): Promise<string | null>;
    pathExists(candidatePath: string): Promise<boolean>;
    getPlatform(): NodeJS.Platform;
    checkAndroidRecordingAvailability(): Promise<DeviceNodeResponse>;
    checkIOSRecordingAvailability(): Promise<DeviceNodeResponse>;
}
export declare const hostPreflightDependencies: HostPreflightDependencies;
export interface RunHostPreflightOptions {
    requestedPlatforms: HostPreflightCheckedPlatform[];
    /**
     * When true the scrcpy / recording check is downgraded to a warning.
     * Pass true for all-deterministic runs — those never record the screen.
     */
    skipRecording?: boolean;
    /**
     * When true the emulator check is downgraded to a warning.
     * Pass true when a physical device is already connected via adb so the
     * emulator binary is not needed to boot an AVD.
     */
    hasConnectedDevice?: boolean;
}
export type HostPreflightFormatMode = 'doctor' | 'test';
export declare function runHostPreflight(options: RunHostPreflightOptions, dependencies?: HostPreflightDependencies): Promise<HostPreflightResult>;
export declare function resolveDoctorRequestedPlatforms(requestedPlatform: string | undefined, hostPlatform?: NodeJS.Platform): HostPreflightCheckedPlatform[];
export declare function resolveTestRequestedPlatforms(requestedPlatform?: string): HostPreflightCheckedPlatform[];
export declare function hasBlockingPreflightFailures(result: HostPreflightResult): boolean;
export declare function shouldBlockLocalRunPreflight(result: HostPreflightResult): boolean;
export declare function formatHostPreflightReport(result: HostPreflightResult, mode: HostPreflightFormatMode): string;
//# sourceMappingURL=hostPreflight.d.ts.map