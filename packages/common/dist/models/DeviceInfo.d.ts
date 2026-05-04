/**
 * Information about a connected device (Android or iOS).
 *
 * Dart equivalent: common/model/DeviceInfo.dart
 */
export declare class DeviceInfo {
    readonly id: string | null;
    readonly deviceUUID: string;
    readonly isAndroid: boolean;
    readonly sdkVersion: number;
    readonly name: string | null;
    constructor(params: {
        id: string | null;
        deviceUUID: string;
        isAndroid: boolean;
        sdkVersion: number;
        name?: string | null;
    });
    getPlatform(): string;
    static fromJson(json: Record<string, unknown>): DeviceInfo;
    toJson(): Record<string, unknown>;
}
//# sourceMappingURL=DeviceInfo.d.ts.map