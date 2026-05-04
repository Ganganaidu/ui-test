"use strict";
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
exports.hostPreflightDependencies = void 0;
exports.runHostPreflight = runHostPreflight;
exports.resolveDoctorRequestedPlatforms = resolveDoctorRequestedPlatforms;
exports.resolveTestRequestedPlatforms = resolveTestRequestedPlatforms;
exports.hasBlockingPreflightFailures = hasBlockingPreflightFailures;
exports.shouldBlockLocalRunPreflight = shouldBlockLocalRunPreflight;
exports.formatHostPreflightReport = formatHostPreflightReport;
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const device_node_1 = require("@usb-ui-test/device-node");
const filePathUtil_js_1 = require("./filePathUtil.js");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
exports.hostPreflightDependencies = {
    createFilePathUtil: () => new filePathUtil_js_1.CliFilePathUtil(undefined, undefined, { downloadAssets: false }),
    execFile: execFileAsync,
    resolveCommand: async (command) => {
        try {
            const { stdout } = await execFileAsync('which', [command]);
            const resolvedPath = stdout.toString().trim();
            if (!resolvedPath) {
                return null;
            }
            await fs.access(resolvedPath);
            return resolvedPath;
        }
        catch {
            return null;
        }
    },
    pathExists: async (candidatePath) => {
        try {
            await fs.access(candidatePath);
            return true;
        }
        catch {
            return false;
        }
    },
    getPlatform: () => process.platform,
    checkAndroidRecordingAvailability: async () => await new device_node_1.AndroidRecordingProvider().checkAvailability(),
    checkIOSRecordingAvailability: async () => await new device_node_1.IOSRecordingProvider().checkAvailability(),
};
async function runHostPreflight(options, dependencies = exports.hostPreflightDependencies) {
    const requestedPlatforms = dedupePlatforms(options.requestedPlatforms);
    const filePathUtil = dependencies.createFilePathUtil();
    const checks = [];
    if (requestedPlatforms.includes(common_1.PLATFORM_ANDROID)) {
        checks.push(...await runAndroidChecks(filePathUtil, dependencies, options));
    }
    if (requestedPlatforms.includes(common_1.PLATFORM_IOS)) {
        checks.push(...await runIOSChecks(filePathUtil, dependencies));
    }
    return {
        requestedPlatforms,
        checks,
    };
}
function resolveDoctorRequestedPlatforms(requestedPlatform, hostPlatform = process.platform) {
    const normalized = normalizeRequestedPlatform(requestedPlatform);
    if (normalized === common_1.PLATFORM_ANDROID) {
        return [common_1.PLATFORM_ANDROID];
    }
    if (normalized === common_1.PLATFORM_IOS) {
        return [common_1.PLATFORM_IOS];
    }
    if (normalized === 'all') {
        return [common_1.PLATFORM_ANDROID, common_1.PLATFORM_IOS];
    }
    return hostPlatform === 'darwin'
        ? [common_1.PLATFORM_ANDROID, common_1.PLATFORM_IOS]
        : [common_1.PLATFORM_ANDROID];
}
function resolveTestRequestedPlatforms(requestedPlatform) {
    const normalized = normalizeRequestedPlatform(requestedPlatform);
    if (normalized === common_1.PLATFORM_ANDROID) {
        return [common_1.PLATFORM_ANDROID];
    }
    if (normalized === common_1.PLATFORM_IOS) {
        return [common_1.PLATFORM_IOS];
    }
    return [common_1.PLATFORM_ANDROID, common_1.PLATFORM_IOS];
}
function hasBlockingPreflightFailures(result) {
    return getBlockingChecks(result).length > 0;
}
function shouldBlockLocalRunPreflight(result) {
    return result.requestedPlatforms.every((platform) => getBlockingChecksForPlatform(result, platform).length > 0);
}
function formatHostPreflightReport(result, mode) {
    if (mode === 'doctor') {
        return formatDoctorReport(result);
    }
    return formatTestReport(result);
}
function formatDoctorReport(result) {
    const lines = [];
    for (const check of result.checks) {
        if (check.status === 'ok') {
            lines.push(`  ✓ ${check.title}`);
        }
        else if (check.status === 'error') {
            lines.push(`  ✗ ${check.title} — ${check.summary}`);
        }
        else {
            lines.push(`  ⚠ ${check.title} — ${check.summary}`);
        }
    }
    return lines.join('\n');
}
function formatTestReport(result) {
    const blockedPlatforms = result.requestedPlatforms.filter((platform) => getBlockingChecksForPlatform(result, platform).length > 0);
    if (blockedPlatforms.length === 0) {
        return 'Local device setup is ready.';
    }
    const heading = blockedPlatforms.length === 1
        ? `Local device setup is blocked for ${formatPlatformLabel(blockedPlatforms[0])}.`
        : 'Local device setup is blocked for Android and iOS.';
    const lines = [heading];
    for (const platform of blockedPlatforms) {
        lines.push('');
        lines.push(`${formatPlatformLabel(platform)} setup required:`);
        for (const check of getBlockingChecksForPlatform(result, platform)) {
            lines.push(...formatCheckLines(check));
        }
    }
    const doctorHint = blockedPlatforms.length === 1
        ? `Run 'usb-ui-test doctor --platform ${blockedPlatforms[0]}' for a full readiness check.`
        : "Run 'usb-ui-test doctor' for a full readiness check.";
    lines.push('');
    lines.push(doctorHint);
    return lines.join('\n');
}
function formatSection(title, checks) {
    const lines = [title];
    if (checks.length === 0) {
        lines.push('- None');
        return lines.join('\n');
    }
    for (const check of checks) {
        lines.push(...formatCheckLines(check));
    }
    return lines.join('\n');
}
function formatCheckLines(check) {
    const lines = [`- ${check.title}: ${check.summary}`];
    if (check.detail) {
        lines.push(`  ${check.detail}`);
    }
    return lines;
}
function getBlockingChecks(result) {
    return result.checks.filter((check) => check.status === 'error' && check.blocking);
}
function getBlockingChecksForPlatform(result, platform) {
    return result.checks.filter((check) => check.status === 'error' &&
        check.blocking &&
        (check.platform === platform || check.platform === 'common'));
}
async function runAndroidChecks(filePathUtil, dependencies, options) {
    const checks = [];
    const adbPath = await filePathUtil.getADBPath();
    checks.push(await checkResolvedCommand({
        platform: common_1.PLATFORM_ANDROID,
        id: 'adb',
        title: 'adb',
        summary: 'Required to communicate with Android devices.',
        detailWhenMissing: 'ADB was not found in ANDROID_HOME, ANDROID_SDK_ROOT, or PATH.',
        detailWhenReady: adbPath ?? undefined,
        resolvedPath: adbPath,
        smokeArgs: ['version'],
        blocking: true,
        dependencies,
    }));
    // The emulator binary is only needed to boot AVDs. When a physical device
    // is already connected via adb we downgrade this to a warning so the run
    // isn't blocked unnecessarily.
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_ANDROID,
        id: 'emulator',
        title: 'emulator',
        summary: 'Required to discover and boot Android Virtual Devices.',
        detailWhenMissing: options.hasConnectedDevice
            ? 'The Android emulator command was not found in PATH (not required — physical device connected).'
            : 'The Android emulator command was not found in PATH.',
        smokeArgs: ['-list-avds'],
        blocking: !options.hasConnectedDevice,
        dependencies,
    }));
    // Screen recording is not needed for deterministic tests — skip the
    // blocking requirement so those runs can proceed without scrcpy installed.
    checks.push(await checkProviderAvailability({
        platform: common_1.PLATFORM_ANDROID,
        id: 'scrcpy',
        title: 'scrcpy',
        summary: options.skipRecording
            ? 'Used for Android screen recording (not required for deterministic tests).'
            : 'Required for Android screen recording during local runs.',
        response: await dependencies.checkAndroidRecordingAvailability(),
        blocking: !options.skipRecording,
    }));
    const resourceDir = filePathUtil.getResourceDir();
    checks.push(await checkResolvedPath({
        platform: common_1.PLATFORM_ANDROID,
        id: 'android-driver-apk',
        title: 'Android driver APK',
        summary: 'Required UsbUiTest Android driver bundle is present.',
        missingSummary: 'Required UsbUiTest Android driver bundle is missing.',
        resolvedPath: await filePathUtil.getDriverAppPath(),
        fallbackDetail: path.join(resourceDir, 'android', 'app-debug.apk'),
        blocking: true,
        dependencies,
    }));
    checks.push(await checkResolvedPath({
        platform: common_1.PLATFORM_ANDROID,
        id: 'android-driver-test-apk',
        title: 'Android test runner APK',
        summary: 'Required UsbUiTest Android instrumentation bundle is present.',
        missingSummary: 'Required UsbUiTest Android instrumentation bundle is missing.',
        resolvedPath: await filePathUtil.getDriverTestAppPath(),
        fallbackDetail: path.join(resourceDir, 'android', 'app-debug-androidTest.apk'),
        blocking: true,
        dependencies,
    }));
    return checks;
}
async function runIOSChecks(filePathUtil, dependencies) {
    const checks = [];
    const hostPlatform = dependencies.getPlatform();
    checks.push(hostPlatform === 'darwin'
        ? createReadyCheck({
            platform: common_1.PLATFORM_IOS,
            id: 'macos-host',
            title: 'macOS host',
            summary: 'macOS is available for iOS simulator support.',
            detail: 'darwin',
            blocking: true,
        })
        : createIssueCheck({
            platform: common_1.PLATFORM_IOS,
            status: 'error',
            id: 'macos-host',
            title: 'macOS host',
            summary: 'iOS simulator support requires macOS.',
            detail: `Current host platform: ${hostPlatform}`,
            blocking: true,
        }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'xcrun',
        title: 'xcrun',
        summary: 'Required to access iOS simulator tooling.',
        detailWhenMissing: 'xcrun was not found in PATH.',
        smokeArgs: ['--help'],
        blocking: true,
        dependencies,
    }));
    checks.push(await checkProviderAvailability({
        platform: common_1.PLATFORM_IOS,
        id: 'xcrun-simctl',
        title: 'xcrun simctl',
        summary: 'Required for iOS simulator recording and control.',
        response: await dependencies.checkIOSRecordingAvailability(),
        blocking: true,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'unzip',
        title: 'unzip',
        summary: 'Required to unpack the bundled iOS driver archives.',
        detailWhenMissing: 'unzip was not found in PATH.',
        smokeArgs: ['-v'],
        blocking: true,
        dependencies,
    }));
    const bashPath = '/bin/bash';
    checks.push(await checkFixedPath({
        platform: common_1.PLATFORM_IOS,
        id: 'bash',
        title: '/bin/bash',
        summary: 'Required for some iOS simulator shell helpers.',
        detailWhenMissing: `${bashPath} is not available on this host.`,
        candidatePath: bashPath,
        blocking: true,
        dependencies,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'plutil',
        title: 'plutil',
        summary: 'Required to parse simulator app metadata.',
        detailWhenMissing: 'plutil was not found in PATH.',
        smokeArgs: ['-help'],
        blocking: true,
        dependencies,
    }));
    const resourceDir = filePathUtil.getResourceDir();
    checks.push(await checkFixedPath({
        platform: common_1.PLATFORM_IOS,
        id: 'ios-driver-archive',
        title: 'iOS driver archive',
        summary: 'Bundled UsbUiTest iOS driver archive is present.',
        missingSummary: 'Bundled UsbUiTest iOS driver archive is missing.',
        detailWhenMissing: `Missing ${path.join(resourceDir, 'ios', 'usb-ui-test-ios.zip')}`,
        candidatePath: path.join(resourceDir, 'ios', 'usb-ui-test-ios.zip'),
        blocking: true,
        dependencies,
    }));
    checks.push(await checkFixedPath({
        platform: common_1.PLATFORM_IOS,
        id: 'ios-driver-runner-archive',
        title: 'iOS test runner archive',
        summary: 'Bundled UsbUiTest iOS test runner archive is present.',
        missingSummary: 'Bundled UsbUiTest iOS test runner archive is missing.',
        detailWhenMissing: `Missing ${path.join(resourceDir, 'ios', 'usb-ui-test-ios-test-Runner.zip')}`,
        candidatePath: path.join(resourceDir, 'ios', 'usb-ui-test-ios-test-Runner.zip'),
        blocking: true,
        dependencies,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'ffmpeg',
        title: 'ffmpeg',
        summary: 'Used to compress iOS recordings after capture.',
        detailWhenMissing: 'ffmpeg was not found in PATH.',
        smokeArgs: ['-version'],
        blocking: false,
        dependencies,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'applesimutils',
        title: 'applesimutils',
        summary: 'Used for simulator permission helpers.',
        detailWhenMissing: 'applesimutils was not found in PATH.',
        smokeArgs: ['--version'],
        blocking: false,
        dependencies,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'lsof',
        title: 'lsof',
        summary: 'Used for stale iOS driver port cleanup.',
        detailWhenMissing: 'lsof was not found in PATH.',
        smokeArgs: ['-v'],
        blocking: false,
        dependencies,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'ps',
        title: 'ps',
        summary: 'Used for stale iOS driver process inspection.',
        detailWhenMissing: 'ps was not found in PATH.',
        smokeArgs: ['-p', String(process.pid)],
        blocking: false,
        dependencies,
    }));
    checks.push(await checkCommandOnPath({
        platform: common_1.PLATFORM_IOS,
        id: 'kill',
        title: 'kill',
        summary: 'Used for stale iOS driver process cleanup.',
        detailWhenMissing: 'kill was not found in PATH.',
        smokeArgs: ['-l'],
        blocking: false,
        dependencies,
    }));
    return checks;
}
async function checkProviderAvailability(params) {
    if (params.response.success) {
        return createReadyCheck({
            platform: params.platform,
            id: params.id,
            title: params.title,
            summary: params.summary,
            detail: params.response.message ?? undefined,
            blocking: params.blocking,
        });
    }
    return createIssueCheck({
        platform: params.platform,
        status: params.blocking ? 'error' : 'warning',
        id: params.id,
        title: params.title,
        summary: params.summary,
        detail: params.response.message ?? undefined,
        blocking: params.blocking,
    });
}
async function checkCommandOnPath(params) {
    const resolvedPath = await params.dependencies.resolveCommand(params.title);
    return await checkResolvedCommand({
        platform: params.platform,
        id: params.id,
        title: params.title,
        summary: params.summary,
        detailWhenMissing: params.detailWhenMissing,
        detailWhenReady: resolvedPath ?? undefined,
        resolvedPath,
        smokeArgs: params.smokeArgs,
        blocking: params.blocking,
        dependencies: params.dependencies,
    });
}
async function checkResolvedCommand(params) {
    if (!params.resolvedPath) {
        return createIssueCheck({
            platform: params.platform,
            status: params.blocking ? 'error' : 'warning',
            id: params.id,
            title: params.title,
            summary: params.summary,
            detail: params.detailWhenMissing,
            blocking: params.blocking,
        });
    }
    try {
        await params.dependencies.execFile(params.resolvedPath, params.smokeArgs);
        return createReadyCheck({
            platform: params.platform,
            id: params.id,
            title: params.title,
            summary: params.summary,
            detail: params.detailWhenReady,
            blocking: params.blocking,
        });
    }
    catch (error) {
        return createIssueCheck({
            platform: params.platform,
            status: params.blocking ? 'error' : 'warning',
            id: params.id,
            title: params.title,
            summary: params.summary,
            detail: formatCommandFailure(params.resolvedPath, params.smokeArgs, error),
            blocking: params.blocking,
        });
    }
}
async function checkResolvedPath(params) {
    if (params.resolvedPath) {
        return createReadyCheck({
            platform: params.platform,
            id: params.id,
            title: params.title,
            summary: params.summary,
            detail: params.resolvedPath,
            blocking: params.blocking,
        });
    }
    return createIssueCheck({
        platform: params.platform,
        status: params.blocking ? 'error' : 'warning',
        id: params.id,
        title: params.title,
        summary: params.missingSummary,
        detail: params.fallbackDetail,
        blocking: params.blocking,
    });
}
async function checkFixedPath(params) {
    if (await params.dependencies.pathExists(params.candidatePath)) {
        return createReadyCheck({
            platform: params.platform,
            id: params.id,
            title: params.title,
            summary: params.summary,
            detail: params.candidatePath,
            blocking: params.blocking,
        });
    }
    return createIssueCheck({
        platform: params.platform,
        status: params.blocking ? 'error' : 'warning',
        id: params.id,
        title: params.title,
        summary: params.missingSummary ?? params.summary,
        detail: params.detailWhenMissing,
        blocking: params.blocking,
    });
}
function createReadyCheck(params) {
    return {
        platform: params.platform,
        status: 'ok',
        id: params.id,
        title: params.title,
        summary: params.summary,
        detail: params.detail,
        blocking: params.blocking,
    };
}
function createIssueCheck(params) {
    return {
        platform: params.platform,
        status: params.status,
        id: params.id,
        title: params.title,
        summary: params.summary,
        detail: params.detail,
        blocking: params.blocking,
    };
}
function formatCommandFailure(file, args, error) {
    const command = [file, ...args].join(' ');
    const message = error instanceof Error ? error.message : String(error);
    return `${command} failed: ${message}`;
}
function normalizeRequestedPlatform(requestedPlatform) {
    if (!requestedPlatform) {
        return undefined;
    }
    const normalized = requestedPlatform.toLowerCase();
    if (normalized === common_1.PLATFORM_ANDROID ||
        normalized === common_1.PLATFORM_IOS ||
        normalized === 'all') {
        return normalized;
    }
    return undefined;
}
function dedupePlatforms(platforms) {
    const seen = new Set();
    const deduped = [];
    for (const platform of platforms) {
        if (seen.has(platform)) {
            continue;
        }
        seen.add(platform);
        deduped.push(platform);
    }
    return deduped;
}
function formatPlatformLabel(platform) {
    return platform === common_1.PLATFORM_ANDROID ? 'Android' : 'iOS';
}
//# sourceMappingURL=hostPreflight.js.map