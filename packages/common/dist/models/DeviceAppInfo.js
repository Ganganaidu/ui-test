"use strict";
// Port of common/model/DeviceAppInfo.dart
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceAppInfo = void 0;
/**
 * Represents an installed app on a device.
 *
 * Dart equivalent: common/model/DeviceAppInfo.dart
 */
class DeviceAppInfo {
    packageName;
    name;
    version;
    constructor(params) {
        this.packageName = params.packageName;
        this.name = params.name;
        this.version = params.version ?? null;
    }
    static fromJson(json) {
        return new DeviceAppInfo({
            packageName: json['packageName'],
            name: json['name'],
            version: json['version'] ?? null,
        });
    }
    toJson() {
        return {
            packageName: this.packageName,
            name: this.name,
            version: this.version,
        };
    }
    // Dart: static List<String> getAppIdList(List<DeviceAppInfo> apps)
    static getAppIdList(apps) {
        return apps.map((app) => app.packageName);
    }
}
exports.DeviceAppInfo = DeviceAppInfo;
//# sourceMappingURL=DeviceAppInfo.js.map