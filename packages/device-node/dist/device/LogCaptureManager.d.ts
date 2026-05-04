import { DeviceNodeResponse } from '@usb-ui-test/common';
import type { LogCaptureProvider } from './LogCaptureProvider.js';
export interface LogCaptureSessionStartParams {
    deviceId: string;
    runId: string;
    testId: string;
    platform: string;
    appIdentifier?: string;
}
export interface LogCaptureStopOptions {
    platform: string;
    keepOutput?: boolean;
}
export interface LogCaptureCleanupOptions {
    platform: string;
    keepOutput?: boolean;
}
export interface LogCaptureAbortOptions {
    deviceId: string;
    platform: string;
    keepOutput?: boolean;
}
export interface DeviceLogCaptureController {
    startLogCapture(params: LogCaptureSessionStartParams): Promise<DeviceNodeResponse>;
    stopLogCapture(runId: string, testId: string, options: LogCaptureStopOptions): Promise<DeviceNodeResponse>;
    cleanupDevice(deviceId: string, options: LogCaptureCleanupOptions): Promise<void>;
    abortLogCapture(runId: string, options: LogCaptureAbortOptions): Promise<void>;
}
export declare class LogCaptureManager implements DeviceLogCaptureController {
    private readonly _logProcessMap;
    private readonly _logInfoMap;
    private readonly _deviceToLogKeysMap;
    private readonly _stoppedTestCases;
    private readonly _providers;
    constructor(params?: {
        providers?: Record<string, LogCaptureProvider>;
        adbPath?: string;
    });
    getMapKey(runId: string, testId: string): string;
    startLogCapture(params: LogCaptureSessionStartParams): Promise<DeviceNodeResponse>;
    stopLogCapture(runId: string, testId: string, options: LogCaptureStopOptions): Promise<DeviceNodeResponse>;
    cleanupDevice(deviceId: string, options: LogCaptureCleanupOptions): Promise<void>;
    abortLogCapture(runId: string, options: LogCaptureAbortOptions): Promise<void>;
    private _sanitizeForFilename;
    private _finalizeStoppedLogCapture;
    private _removeDeviceLogKey;
    private _formatError;
}
export declare const defaultLogCaptureManager: LogCaptureManager;
//# sourceMappingURL=LogCaptureManager.d.ts.map