/**
 * Response wrapper from device operations (gRPC → Device → Agent).
 *
 * Dart equivalent: common/model/DeviceNodeResponse.dart
 */
export declare class DeviceNodeResponse {
    readonly success: boolean;
    readonly message: string | null;
    readonly data: Record<string, unknown> | null;
    constructor(params: {
        success: boolean;
        message?: string | null;
        data?: Record<string, unknown> | null;
    });
    static fromJson(json: Record<string, unknown>): DeviceNodeResponse;
    toJson(): Record<string, unknown>;
}
//# sourceMappingURL=DeviceNodeResponse.d.ts.map