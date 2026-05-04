"use strict";
// Port of common/model/DeviceActionRequest.dart
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceActionRequest = void 0;
/**
 * Wraps a DeviceAction for device execution, adding requestId and timeout.
 *
 * Dart equivalent: common/model/DeviceActionRequest.dart
 */
class DeviceActionRequest {
    requestId;
    action;
    timeout;
    shouldEnsureStability;
    traceStep;
    constructor(params) {
        this.requestId = params.requestId;
        this.action = params.action;
        this.timeout = params.timeout ?? 30;
        this.shouldEnsureStability = params.shouldEnsureStability ?? true;
        this.traceStep = params.traceStep ?? null;
    }
    toJson() {
        return {
            requestId: this.requestId,
            action: this.action.toJson(),
            timeout: this.timeout,
            shouldEnsureStability: this.shouldEnsureStability,
            traceStep: this.traceStep,
        };
    }
}
exports.DeviceActionRequest = DeviceActionRequest;
//# sourceMappingURL=DeviceActionRequest.js.map