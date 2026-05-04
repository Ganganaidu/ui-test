import { DeviceNodeResponse, type RecordingRequest } from '@usb-ui-test/common';
import type { RecordingProvider } from './RecordingProvider.js';
export interface RecordingSessionStartParams {
    deviceId: string;
    recordingRequest: RecordingRequest;
    platform: string;
    sdkVersion?: string;
}
export interface RecordingStopOptions {
    platform: string;
    keepOutput?: boolean;
}
export interface RecordingCleanupOptions {
    platform: string;
    keepOutput?: boolean;
}
export interface RecordingAbortOptions {
    deviceId: string;
    platform: string;
    keepOutput?: boolean;
}
export interface DeviceRecordingController {
    startRecording(params: RecordingSessionStartParams): Promise<DeviceNodeResponse>;
    stopRecording(runId: string, testId: string, options: RecordingStopOptions): Promise<DeviceNodeResponse>;
    cleanupDevice(deviceId: string, options: RecordingCleanupOptions): Promise<void>;
    abortRecording(runId: string, options: RecordingAbortOptions): Promise<void>;
}
export declare class RecordingManager implements DeviceRecordingController {
    private readonly _recordingProcessMap;
    private readonly _recordingInfoMap;
    private readonly _deviceToRecordingKeysMap;
    private readonly _stoppedTestCases;
    private readonly _providers;
    private readonly _cwdProvider;
    constructor(params?: {
        providers?: Record<string, RecordingProvider>;
        cwdProvider?: () => string;
    });
    getMapKey(runId: string, testId: string): string;
    startRecording(params: RecordingSessionStartParams): Promise<DeviceNodeResponse>;
    stopRecording(runId: string, testId: string, options: RecordingStopOptions): Promise<DeviceNodeResponse>;
    cleanupDevice(deviceId: string, options: RecordingCleanupOptions): Promise<void>;
    abortRecording(runId: string, options: RecordingAbortOptions): Promise<void>;
    private _sanitizeForFilename;
    private _finalizeStoppedRecording;
    private _shouldPreserveFailedStopOutput;
    private _removeDeviceRecordingKey;
    private _formatError;
}
export declare const defaultRecordingManager: RecordingManager;
//# sourceMappingURL=RecordingManager.d.ts.map