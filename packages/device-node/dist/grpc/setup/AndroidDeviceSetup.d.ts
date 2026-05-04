import { DeviceInfo, type FilePathUtil } from '@usb-ui-test/common';
import { type AdbClient } from '../../infra/android/AdbClient.js';
import type { GrpcDriverClient } from '../GrpcDriverClient.js';
export interface AndroidDriverProcessHandle {
    pid?: number;
    stdout?: NodeJS.ReadableStream | null;
    stderr?: NodeJS.ReadableStream | null;
    killed?: boolean;
    kill(signal?: NodeJS.Signals | number): boolean;
    on(event: 'exit', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
}
export declare class AndroidDeviceSetup {
    private _adbClient;
    private _filePathUtil;
    private _connectWithPolling;
    private _startAndroidDriverFn;
    private _captureReadinessTimeoutMs;
    private _captureReadinessDelayMs;
    constructor(params: {
        adbClient: AdbClient;
        filePathUtil: FilePathUtil;
        connectWithPolling: (grpcClient: GrpcDriverClient, host: string, port: number, options?: {
            getStartupFailureMessage?: () => string | null;
            getWaitStatusMessage?: () => string | null;
            getTimeoutMessage?: () => string | null;
        }) => Promise<boolean>;
        startAndroidDriverFn: (adbPath: string, deviceSerial: string, port: number) => AndroidDriverProcessHandle;
        captureReadinessTimeoutMs: number;
        captureReadinessDelayMs: number;
    });
    prepare(deviceInfo: DeviceInfo, grpcClient: GrpcDriverClient): Promise<{
        adbPath: string;
        deviceSerial: string;
    }>;
    private _trackAndroidDriverProcess;
    private _formatWaitStatus;
    private _buildTimeoutMessage;
    private _cleanupStaleDriverProcesses;
    /**
     * Poll `pidof <package>` until the process disappears or the cap elapses.
     * Returns true if the process is confirmed gone, false on cap timeout.
     * Callers decide whether a timeout is fatal: pre-run cleanup treats it as
     * best-effort (subsequent phases will surface real problems), but the
     * inter-attempt retry path must NOT proceed on a timeout — the stale
     * UiAutomation binding we were waiting to release is the exact race the
     * retry is meant to avoid.
     */
    private _waitForProcessGone;
    /**
     * Install APKs already done; port forward already set up. This brings up a
     * single instrumentation attempt: spawn the driver, track its process, and
     * poll the gRPC port. On failure it cleans up the spawned process before
     * re-throwing so the caller doesn't leak a pid.
     */
    private _spawnDriverAndAwaitGrpc;
    /**
     * Poll `getScreenshotAndHierarchy` until UiAutomation is bound or the
     * capture-readiness window expires. Only the transient window-expired case
     * throws `CaptureReadinessError` so `prepare` retries once; a non-transient
     * failure (e.g. "device offline", permission denied) throws a plain Error
     * and falls straight to rollback. A process-death failure also surfaces
     * directly via `startupState.failureMessage` — no retry.
     */
    private _awaitCaptureReadiness;
    /**
     * Inter-attempt teardown used when the first driver start succeeded at the
     * gRPC level but failed the UiAutomation readiness gate. Kills the prior
     * process, force-stops both packages, clears the test package's state, and
     * waits for its process to exit before the next attempt starts.
     * Returns true if the prior instrumentation host is confirmed gone — the
     * retry should only proceed in that case.
     */
    private _tearDownDriverAttempt;
    private _rollbackFailedSetup;
}
//# sourceMappingURL=AndroidDeviceSetup.d.ts.map