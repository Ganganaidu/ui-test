import { spawn, type ChildProcess } from 'child_process';
import { DeviceNodeResponse, type RecordingRequest } from '@usb-ui-test/common';
import type { RecordingProvider, RecordingProviderResult } from './RecordingProvider.js';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
type DelayFn = (ms: number) => Promise<void>;
export declare class ScrcpyStartupInterruptedError extends Error {
    readonly signal: NodeJS.Signals;
    constructor(signal: NodeJS.Signals);
}
/**
 * Android screen recording via host-installed `scrcpy`.
 * Uses headless recording to keep parity with the existing iOS artifact flow.
 */
export declare class AndroidRecordingProvider implements RecordingProvider {
    static readonly RECORDING_FOLDER = "fr_android_screen_recording";
    static readonly DEFAULT_STARTUP_SETTLE_MS = 1000;
    private readonly _execFileFn;
    private readonly _spawnFn;
    private readonly _delayFn;
    private readonly _startupSettleMs;
    constructor(params?: {
        execFileFn?: ExecFileFn;
        spawnFn?: typeof spawn;
        delayFn?: DelayFn;
        startupSettleMs?: number;
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
    private _awaitSpawn;
    private _waitForStableStartup;
    private _formatStartupExit;
    private _waitForExit;
    private _formatError;
}
export {};
//# sourceMappingURL=AndroidRecordingProvider.d.ts.map