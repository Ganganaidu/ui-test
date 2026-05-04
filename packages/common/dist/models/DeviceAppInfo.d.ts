/**
 * Represents an installed app on a device.
 *
 * Dart equivalent: common/model/DeviceAppInfo.dart
 */
export declare class DeviceAppInfo {
    readonly packageName: string;
    readonly name: string;
    readonly version: string | null;
    constructor(params: {
        packageName: string;
        name: string;
        version?: string | null;
    });
    static fromJson(json: Record<string, unknown>): DeviceAppInfo;
    toJson(): Record<string, unknown>;
    static getAppIdList(apps: DeviceAppInfo[]): string[];
}
//# sourceMappingURL=DeviceAppInfo.d.ts.map