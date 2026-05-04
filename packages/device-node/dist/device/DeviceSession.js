"use strict";
// Minimal session state carried across device actions.
// Restores the subset of Dart's DeviceSession needed for screenshot capture.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceSession = void 0;
class DeviceSession {
    _shouldEnsureStability = true;
    get shouldEnsureStability() {
        return this._shouldEnsureStability;
    }
    setShouldEnsureStability(shouldEnsureStability) {
        this._shouldEnsureStability = shouldEnsureStability ?? true;
    }
}
exports.DeviceSession = DeviceSession;
//# sourceMappingURL=DeviceSession.js.map