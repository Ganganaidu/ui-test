import { DeviceNodeResponse } from '@usb-ui-test/common';
import type { GrpcDriverClient } from '../grpc/GrpcDriverClient.js';
import type { DeviceSession } from '../device/DeviceSession.js';
import { type CaptureReadinessResult } from '../device/ScreenshotCapture.js';
export interface CaptureReadinessOptions {
    timeoutMs?: number;
    delayMs?: number;
}
export type { CaptureReadinessResult } from '../device/ScreenshotCapture.js';
export declare class ScreenshotCaptureCoordinator {
    private _helper;
    constructor(params: {
        grpcClient: GrpcDriverClient;
        session: DeviceSession;
    });
    capture(traceStep?: number | null): Promise<DeviceNodeResponse>;
}
export declare function waitForDriverCaptureReadiness(grpcClient: GrpcDriverClient, options?: CaptureReadinessOptions): Promise<CaptureReadinessResult>;
//# sourceMappingURL=ScreenshotCaptureCoordinator.d.ts.map