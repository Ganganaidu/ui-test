import { DeviceAction } from './DeviceAction.js';
/**
 * Wraps a DeviceAction for device execution, adding requestId and timeout.
 *
 * Dart equivalent: common/model/DeviceActionRequest.dart
 */
export declare class DeviceActionRequest {
    readonly requestId: string;
    readonly action: DeviceAction;
    readonly timeout: number;
    readonly shouldEnsureStability: boolean;
    readonly traceStep: number | null;
    constructor(params: {
        requestId: string;
        action: DeviceAction;
        timeout?: number;
        shouldEnsureStability?: boolean;
        traceStep?: number | null;
    });
    toJson(): Record<string, unknown>;
}
//# sourceMappingURL=DeviceActionRequest.d.ts.map