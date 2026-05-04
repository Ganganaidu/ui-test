import { DeviceNodeResponse } from '@usb-ui-test/common';
import type { GrpcDriverClient, GrpcScreenshotResponse } from '../grpc/GrpcDriverClient.js';
import type { DeviceSession } from './DeviceSession.js';
export interface CaptureValidationResult {
    valid: boolean;
    transient: boolean;
    message: string | null;
}
export interface CaptureTraceMetadata {
    totalMs: number;
    stabilityMs?: number;
    finalPayloadMs: number;
    stable: boolean;
    pollCount: number;
    attempts: number;
    failureReason?: string;
}
interface CaptureReadinessOptions {
    timeoutMs?: number;
    delayMs?: number;
}
export declare function isTransientCaptureFailureMessage(message: string | null | undefined): boolean;
export declare function validateScreenshotCaptureResponse(response: GrpcScreenshotResponse): CaptureValidationResult;
export type CaptureReadinessResult = {
    ready: true;
    message: null;
} | {
    ready: false;
    transient: boolean;
    message: string | null;
};
export declare function waitForCaptureReadiness(grpcClient: GrpcDriverClient, options?: CaptureReadinessOptions): Promise<CaptureReadinessResult>;
export declare class ScreenshotCaptureHelper {
    private _grpcClient;
    private _session;
    constructor(params: {
        grpcClient: GrpcDriverClient;
        session: DeviceSession;
    });
    capture(traceStep?: number | null): Promise<DeviceNodeResponse>;
    private _captureWithRetry;
    private _waitForStableScreen;
    private _getRawScreenshot;
    private _toResponse;
}
export {};
//# sourceMappingURL=ScreenshotCapture.d.ts.map