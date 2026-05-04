import { spawn, type ChildProcess } from 'child_process';
import { DeviceNodeResponse } from '@usb-ui-test/common';
import type { LogCaptureProvider } from './LogCaptureProvider.js';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
/**
 * Android device log capture via `adb logcat`.
 * Clears the ring buffer before capture, then streams in threadtime format.
 */
export declare class AndroidLogcatProvider implements LogCaptureProvider {
    private readonly _execFileFn;
    private readonly _spawnFn;
    private readonly _adbPath;
    constructor(params?: {
        execFileFn?: ExecFileFn;
        spawnFn?: typeof spawn;
        adbPath?: string;
    });
    get fileExtension(): string;
    get platformName(): string;
    startLogCapture(params: {
        deviceId: string;
        outputFilePath: string;
        appIdentifier?: string;
    }): Promise<{
        process: ChildProcess;
        response: DeviceNodeResponse;
    }>;
    stopLogCapture(params: {
        process: ChildProcess;
        outputFilePath: string;
    }): Promise<DeviceNodeResponse>;
    checkAvailability(): Promise<DeviceNodeResponse>;
    cleanupPlatformResources(deviceId: string): Promise<void>;
    private _waitForExit;
    private _formatError;
}
export {};
//# sourceMappingURL=AndroidLogcatProvider.d.ts.map