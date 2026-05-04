"use strict";
// Port of common/model/DeviceNodeResponse.dart
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceNodeResponse = void 0;
/**
 * Response wrapper from device operations (gRPC → Device → Agent).
 *
 * Dart equivalent: common/model/DeviceNodeResponse.dart
 */
class DeviceNodeResponse {
    success;
    message;
    data;
    constructor(params) {
        this.success = params.success;
        this.message = params.message ?? null;
        this.data = params.data ?? null;
    }
    static fromJson(json) {
        return new DeviceNodeResponse({
            success: json['success'],
            message: json['message'] ?? null,
            data: json['data'] ?? null,
        });
    }
    toJson() {
        return {
            success: this.success,
            message: this.message,
            data: this.data,
        };
    }
}
exports.DeviceNodeResponse = DeviceNodeResponse;
//# sourceMappingURL=DeviceNodeResponse.js.map