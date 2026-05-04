import { spawn, type ChildProcess } from 'child_process';
import { DeviceNodeResponse, type RecordingRequest } from '@usb-ui-test/common';
import type { RecordingProvider, RecordingProviderResult } from './RecordingProvider.js';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
/**
 * iOS screen recording via `xcrun simctl io <udid> recordVideo`.
 * Mirrors the studio-flutter implementation for booted simulators.
 */
export declare class IOSRecordingProvider implements RecordingProvider {
    static readonly RECORDING_FOLDER = "fr_ios_screen_recording";
    private readonly _execFileFn;
    private readonly _spawnFn;
    constructor(params?: {
        execFileFn?: ExecFileFn;
        spawnFn?: typeof spawn;
    });
    get recordingFolder(): string;
    get platformName(): string;
    get fileExtension(): string;
    startRecordingProcess(params: {
        deviceId: string;
        filePath: string;
        recordingRequest: RecordingRequest;
        sdkVersion?: string;
    }): Promise<RecordingProviderResult>;
    stopRecordingProcess(params: {
        process: ChildProcess;
        deviceId: string;
        fileName: string;
        filePath: string;
    }): Promise<DeviceNodeResponse>;
    checkAvailability(): Promise<DeviceNodeResponse>;
    cleanupPlatformResources(deviceId: string): Promise<void>;
    private _commandExists;
    private _checkFfmpegAvailability;
    private _compressVideo;
    private _awaitSpawn;
    private _waitForExit;
    private _formatError;
}
export {};
//# sourceMappingURL=IOSRecordingProvider.d.ts.map