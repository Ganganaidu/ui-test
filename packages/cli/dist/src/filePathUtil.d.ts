import type { FilePathUtil } from '@usb-ui-test/common';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
interface CliFilePathUtilOptions {
    downloadAssets?: boolean;
}
/**
 * CLI-specific file path resolver.
 * Locates ADB, driver app binaries, and user app files.
 *
 * Dart equivalent: CliFilePathUtil in mobile_cli/lib/cli_file_path_util.dart
 */
export declare class CliFilePathUtil implements FilePathUtil {
    private _assetStore;
    private _execFileFn;
    constructor(resourceDir?: string, execFileFn?: ExecFileFn, options?: CliFilePathUtilOptions);
    /**
     * Find ADB path: check ANDROID_HOME, then try `which adb`.
     * Dart: Future<String?> getADBPath()
     */
    getADBPath(): Promise<string | null>;
    /**
     * Get path to the Android driver app APK (the main app).
     * File: resources/android/app-debug.apk
     */
    getDriverAppPath(): Promise<string | null>;
    /**
     * Get path to the Android test runner APK (instrumentation test APK).
     * File: resources/android/app-debug-androidTest.apk
     */
    getDriverTestAppPath(): Promise<string | null>;
    getResourceDir(): string;
    /**
     * Get path to the extracted iOS runner app.
     * Files are extracted from resources/ios/usb-ui-test-ios.zip and
     * resources/ios/usb-ui-test-ios-test-Runner.zip into Debug-iphonesimulator/.
     */
    getIOSDriverAppPath(): Promise<string | null>;
    /**
     * Get the path to a user's app file (APK/IPA specified by name).
     */
    getAppFilePath(appFileName: string): Promise<string>;
    /**
     * Ensure iOS apps are available (extract from .zip if needed).
     */
    ensureIOSAppsAvailable(): Promise<void>;
    private _resolveIOSExtractedAppPaths;
}
export {};
//# sourceMappingURL=filePathUtil.d.ts.map