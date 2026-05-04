"use strict";
// Port of common/model/AppUpload.dart (minimal — only fields used by goal-executor)
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppUpload = void 0;
/**
 * Represents an app upload configuration (used internally for LaunchAppAction).
 *
 * Dart equivalent: common/model/AppUpload.dart
 */
class AppUpload {
    id;
    platform;
    packageName;
    constructor(params) {
        this.id = params.id;
        this.platform = params.platform;
        this.packageName = params.packageName;
    }
}
exports.AppUpload = AppUpload;
//# sourceMappingURL=AppUpload.js.map