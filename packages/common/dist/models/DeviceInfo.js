"use strict";
// Port of common/model/DeviceInfo.dart
// Only the fields used by the CLI / goal-executor
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceInfo = void 0;
const constants_js_1 = require("../constants.js");
/**
 * Information about a connected device (Android or iOS).
 *
 * Dart equivalent: common/model/DeviceInfo.dart
 */
class DeviceInfo {
    // Dart: String? id — the device serial (e.g. ADB serial or UDID)
    id;
    // Dart: String deviceUUID — unique identifier
    deviceUUID;
    // Dart: bool isAndroid
    isAndroid;
    // Dart: int sdkVersion
    sdkVersion;
    // Dart: String? name
    name;
    constructor(params) {
        this.id = params.id;
        this.deviceUUID = params.deviceUUID;
        this.isAndroid = params.isAndroid;
        this.sdkVersion = params.sdkVersion;
        this.name = params.name ?? null;
    }
    // Dart: String getPlatform()
    getPlatform() {
        return this.isAndroid ? constants_js_1.PLATFORM_ANDROID : constants_js_1.PLATFORM_IOS;
    }
    // Dart: factory DeviceInfo.fromJson(Map<String, dynamic> json)
    static fromJson(json) {
        return new DeviceInfo({
            id: json['id'] ?? null,
            deviceUUID: json['deviceUUID'],
            isAndroid: json['isAndroid'],
            sdkVersion: json['sdkVersion'],
            name: json['name'] ?? null,
        });
    }
    toJson() {
        return {
            id: this.id,
            deviceUUID: this.deviceUUID,
            isAndroid: this.isAndroid,
            sdkVersion: this.sdkVersion,
            name: this.name,
        };
    }
}
exports.DeviceInfo = DeviceInfo;
//# sourceMappingURL=DeviceInfo.js.map