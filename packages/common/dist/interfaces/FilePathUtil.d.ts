/**
 * Abstract interface for resolving file paths to executables and driver apps.
 * Implemented by CliFilePathUtil in @usb-ui-test/cli.
 *
 * Dart equivalent: common/interface/FilePathUtil.dart
 */
export interface FilePathUtil {
    getADBPath(): Promise<string | null>;
    getDriverAppPath(): Promise<string | null>;
    getDriverTestAppPath(): Promise<string | null>;
    getIOSDriverAppPath(): Promise<string | null>;
    getAppFilePath(appFileName: string): Promise<string>;
    ensureIOSAppsAvailable(): Promise<void>;
}
//# sourceMappingURL=FilePathUtil.d.ts.map