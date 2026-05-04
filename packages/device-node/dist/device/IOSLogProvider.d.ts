import { spawn, type ChildProcess } from 'child_process';
import { DeviceNodeResponse } from '@usb-ui-test/common';
import type { LogCaptureProvider } from './LogCaptureProvider.js';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
/**
 * iOS simulator log capture via `xcrun simctl spawn <udid> log stream --style compact`.
 */
export declare class IOSLogProvider implements LogCaptureProvider {
    private readonly _execFileFn;
    private readonly _spawnFn;
    constructor(params?: {
        execFileFn?: ExecFileFn;
        spawnFn?: typeof spawn;
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
//# sourceMappingURL=IOSLogProvider.d.ts.map