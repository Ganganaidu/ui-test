"use strict";
// Port of mobile_cli/lib/cli_file_path_util.dart
// Resolves paths to ADB, driver APKs, and iOS apps.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliFilePathUtil = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const runtimeAssets_js_1 = require("./runtimeAssets.js");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * CLI-specific file path resolver.
 * Locates ADB, driver app binaries, and user app files.
 *
 * Dart equivalent: CliFilePathUtil in mobile_cli/lib/cli_file_path_util.dart
 */
class CliFilePathUtil {
    _assetStore;
    _execFileFn;
    constructor(resourceDir, execFileFn, options) {
        this._assetStore = new runtimeAssets_js_1.RuntimeAssetStore(resourceDir, {
            downloadAssets: options?.downloadAssets,
        });
        this._execFileFn = execFileFn ?? execFileAsync;
    }
    /**
     * Find ADB path: check ANDROID_HOME, then try `which adb`.
     * Dart: Future<String?> getADBPath()
     */
    async getADBPath() {
        // Check ANDROID_HOME first
        const androidHome = process.env['ANDROID_HOME'] ?? process.env['ANDROID_SDK_ROOT'];
        if (androidHome) {
            const adbPath = path.join(androidHome, 'platform-tools', 'adb');
            if (fs.existsSync(adbPath)) {
                return adbPath;
            }
        }
        // Try `which adb`
        try {
            const { stdout } = await execFileAsync('which', ['adb']);
            const resolved = stdout.trim();
            if (resolved && fs.existsSync(resolved)) {
                return resolved;
            }
        }
        catch {
            // adb not in PATH
        }
        return null;
    }
    /**
     * Get path to the Android driver app APK (the main app).
     * File: resources/android/app-debug.apk
     */
    async getDriverAppPath() {
        return await this._assetStore.resolveAssetPath('android-driver-apk');
    }
    /**
     * Get path to the Android test runner APK (instrumentation test APK).
     * File: resources/android/app-debug-androidTest.apk
     */
    async getDriverTestAppPath() {
        return await this._assetStore.resolveAssetPath('android-driver-test-apk');
    }
    getResourceDir() {
        return this._assetStore.getResourceDir();
    }
    /**
     * Get path to the extracted iOS runner app.
     * Files are extracted from resources/ios/usb-ui-test-ios.zip and
     * resources/ios/usb-ui-test-ios-test-Runner.zip into Debug-iphonesimulator/.
     */
    async getIOSDriverAppPath() {
        await this.ensureIOSAppsAvailable();
        const { runnerAppPath } = this._resolveIOSExtractedAppPaths();
        if (!fs.existsSync(runnerAppPath)) {
            throw new Error(`Extracted iOS runner app not found: ${runnerAppPath}`);
        }
        return runnerAppPath;
    }
    /**
     * Get the path to a user's app file (APK/IPA specified by name).
     */
    async getAppFilePath(appFileName) {
        // First check absolute path
        if (path.isAbsolute(appFileName) && fs.existsSync(appFileName)) {
            return appFileName;
        }
        // Check relative to CWD
        const cwdPath = path.resolve(process.cwd(), appFileName);
        if (fs.existsSync(cwdPath)) {
            return cwdPath;
        }
        throw new Error(`App file not found: ${appFileName}`);
    }
    /**
     * Ensure iOS apps are available (extract from .zip if needed).
     */
    async ensureIOSAppsAvailable() {
        const { appPath, runnerAppPath, targetDir } = this._resolveIOSExtractedAppPaths();
        if (fs.existsSync(appPath) && fs.existsSync(runnerAppPath)) {
            return;
        }
        const appZipPath = await this._assetStore.resolveAssetPath('ios-driver-archive');
        const runnerZipPath = await this._assetStore.resolveAssetPath('ios-driver-runner-archive');
        const iosDir = path.join(this.getResourceDir(), 'ios');
        if (!appZipPath || !fs.existsSync(appZipPath)) {
            throw new Error(`Missing iOS driver archive in ${iosDir}. Configure USB_UI_TEST_ASSET_DIR, USB_UI_TEST_ASSET_MANIFEST_PATH, or USB_UI_TEST_ASSET_MANIFEST_URL.`);
        }
        if (!runnerZipPath || !fs.existsSync(runnerZipPath)) {
            throw new Error(`Missing iOS test runner archive in ${iosDir}. Configure USB_UI_TEST_ASSET_DIR, USB_UI_TEST_ASSET_MANIFEST_PATH, or USB_UI_TEST_ASSET_MANIFEST_URL.`);
        }
        fs.mkdirSync(targetDir, { recursive: true });
        for (const zipPath of [appZipPath, runnerZipPath]) {
            try {
                await this._execFileFn('unzip', ['-o', zipPath, '-d', targetDir]);
            }
            catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : String(error);
                throw new Error(`Failed to unzip iOS driver archive ${zipPath}: ${message}`);
            }
        }
        if (!fs.existsSync(runnerAppPath)) {
            throw new Error(`Extracted iOS runner app not found: ${runnerAppPath}`);
        }
    }
    _resolveIOSExtractedAppPaths() {
        const targetDir = path.join(this.getResourceDir(), 'ios', 'Debug-iphonesimulator');
        return {
            targetDir,
            appPath: path.join(targetDir, 'usb-ui-test-ios.app'),
            runnerAppPath: path.join(targetDir, 'usb-ui-test-ios-test-Runner.app'),
        };
    }
}
exports.CliFilePathUtil = CliFilePathUtil;
//# sourceMappingURL=filePathUtil.js.map