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
exports.readAppConfig = readAppConfig;
exports.resolveAppConfig = resolveAppConfig;
exports.formatResolvedAppSummary = formatResolvedAppSummary;
exports.resolveAppOverrideIdentifier = resolveAppOverrideIdentifier;
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, node_util_1.promisify)(node_child_process_1.execFile);
const APP_TOP_LEVEL_KEYS = new Set(['name', 'packageName', 'bundleId']);
function readAppConfig(value, label) {
    if (value === undefined || value === null) {
        return undefined;
    }
    assertPlainObject(value, label);
    if (value['android'] !== undefined || value['ios'] !== undefined) {
        throw new Error(`${label} uses an unsupported nested format. Use app.name, app.packageName, and app.bundleId.`);
    }
    assertAllowedKeys(value, APP_TOP_LEVEL_KEYS, label);
    const app = {
        name: readOptionalTrimmedString(value['name'], `${label} name`),
        packageName: readOptionalTrimmedString(value['packageName'], `${label} packageName`),
        bundleId: readOptionalTrimmedString(value['bundleId'], `${label} bundleId`),
    };
    if (!app.packageName && !app.bundleId) {
        throw new Error(`${label} must define at least one of packageName or bundleId.`);
    }
    return app;
}
function resolveAppConfig(params) {
    const workspaceApp = params.workspaceApp;
    if (!workspaceApp?.packageName && !workspaceApp?.bundleId) {
        throw new Error('.usb-ui-test/config.yaml must define app.packageName and/or app.bundleId. App config is required for UsbUiTest runs.');
    }
    const effectiveApp = params.environmentApp ?? workspaceApp;
    const platform = resolveSelectedPlatform({
        requestedPlatform: params.requestedPlatform,
        inferredPlatform: params.appOverride?.inferredPlatform,
        app: effectiveApp,
    });
    if (platform === common_1.PLATFORM_ANDROID) {
        if (!effectiveApp.packageName) {
            throw new Error('No app config found for platform "android". Add app.packageName to .usb-ui-test/config.yaml or choose a different --platform.');
        }
        const resolved = {
            platform,
            identifier: effectiveApp.packageName,
            identifierKind: 'packageName',
            name: effectiveApp.name,
            sourceEnvName: params.environmentApp ? params.envName : undefined,
        };
        validateResolvedOverrideMatch(params.appOverride, resolved);
        return resolved;
    }
    if (!effectiveApp.bundleId) {
        throw new Error('No app config found for platform "ios". Add app.bundleId to .usb-ui-test/config.yaml or choose a different --platform.');
    }
    const resolved = {
        platform,
        identifier: effectiveApp.bundleId,
        identifierKind: 'bundleId',
        name: effectiveApp.name,
        sourceEnvName: params.environmentApp ? params.envName : undefined,
    };
    validateResolvedOverrideMatch(params.appOverride, resolved);
    return resolved;
}
function formatResolvedAppSummary(app) {
    return app.platform === common_1.PLATFORM_ANDROID
        ? `Using Android package: ${app.identifier}`
        : `Using iOS bundle ID: ${app.identifier}`;
}
async function resolveAppOverrideIdentifier(appOverride) {
    const platform = normalizePlatform(appOverride.inferredPlatform, 'App override platform');
    if (platform === common_1.PLATFORM_ANDROID) {
        return await resolveAndroidPackageName(appOverride.appPath);
    }
    return await resolveIOSBundleId(appOverride.appPath);
}
function resolveSelectedPlatform(params) {
    const requestedPlatform = normalizePlatform(params.requestedPlatform, '--platform', { allowUndefined: true });
    const inferredPlatform = normalizePlatform(params.inferredPlatform, 'App override platform', { allowUndefined: true });
    if (requestedPlatform &&
        inferredPlatform &&
        requestedPlatform !== inferredPlatform) {
        throw new Error(formatOverridePlatformMismatch(inferredPlatform, requestedPlatform));
    }
    if (requestedPlatform) {
        return requestedPlatform;
    }
    if (inferredPlatform) {
        return inferredPlatform;
    }
    const configuredPlatforms = [
        params.app.packageName ? common_1.PLATFORM_ANDROID : null,
        params.app.bundleId ? common_1.PLATFORM_IOS : null,
    ].filter((platform) => platform !== null);
    if (configuredPlatforms.length === 1) {
        return configuredPlatforms[0];
    }
    throw new Error('Both Android and iOS app identifiers are configured. Pass --platform android or --platform ios.');
}
function validateResolvedOverrideMatch(appOverride, resolvedApp) {
    if (!appOverride) {
        return;
    }
    const overridePlatform = normalizePlatform(appOverride.inferredPlatform, 'App override platform');
    if (overridePlatform !== resolvedApp.platform) {
        throw new Error(formatOverridePlatformMismatch(overridePlatform, resolvedApp.platform));
    }
    if (!appOverride.resolvedIdentifier) {
        return;
    }
    if (appOverride.resolvedIdentifier === resolvedApp.identifier) {
        return;
    }
    if (resolvedApp.platform === common_1.PLATFORM_ANDROID) {
        throw new Error(`Configured Android package is "${resolvedApp.identifier}", but the override app resolved to "${appOverride.resolvedIdentifier}".`);
    }
    throw new Error(`Configured iOS bundle ID is "${resolvedApp.identifier}", but the override app resolved to "${appOverride.resolvedIdentifier}".`);
}
function normalizePlatform(value, label, options) {
    if (value === undefined || value === null) {
        if (options?.allowUndefined) {
            return undefined;
        }
        throw new Error(`${label} must be android or ios.`);
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === common_1.PLATFORM_ANDROID || normalized === common_1.PLATFORM_IOS) {
        return normalized;
    }
    throw new Error(`${label} must be android or ios.`);
}
async function resolveAndroidPackageName(appPath) {
    const toolErrors = [];
    const aaptCandidates = await resolveAndroidToolCandidates('aapt');
    for (const candidate of aaptCandidates) {
        try {
            const { stdout } = await execFileAsync(candidate, ['dump', 'badging', appPath]);
            const match = stdout.toString().match(/^package: name='([^']+)'/m);
            if (match?.[1]) {
                return match[1];
            }
            toolErrors.push(`${path.basename(candidate)} did not return a package name.`);
        }
        catch (error) {
            toolErrors.push(formatExecError(candidate, error));
        }
    }
    const apkanalyzerCandidates = await resolveAndroidToolCandidates('apkanalyzer');
    for (const candidate of apkanalyzerCandidates) {
        try {
            const { stdout } = await execFileAsync(candidate, ['manifest', 'application-id', appPath]);
            const packageName = stdout.toString().trim();
            if (packageName.length > 0) {
                return packageName;
            }
            toolErrors.push(`${path.basename(candidate)} did not return a package name.`);
        }
        catch (error) {
            toolErrors.push(formatExecError(candidate, error));
        }
    }
    if (aaptCandidates.length === 0 && apkanalyzerCandidates.length === 0) {
        throw new Error(`Unable to resolve the Android package name from ${appPath}. Install Android build-tools (aapt) or Android cmdline-tools (apkanalyzer) to use --app with Android overrides.`);
    }
    throw new Error(`Unable to resolve the Android package name from ${appPath}. ${toolErrors[0] ?? 'No compatible Android package resolver succeeded.'}`);
}
async function resolveIOSBundleId(appPath) {
    const plistPath = await findIOSInfoPlist(appPath);
    if (!plistPath) {
        throw new Error(`Unable to resolve the iOS bundle ID from ${appPath}. Info.plist was not found.`);
    }
    try {
        const { stdout } = await execFileAsync('plutil', [
            '-extract',
            'CFBundleIdentifier',
            'raw',
            '-o',
            '-',
            plistPath,
        ]);
        const bundleId = stdout.toString().trim();
        if (bundleId.length > 0) {
            return bundleId;
        }
    }
    catch {
        // Fall back to parsing a text plist when plutil is unavailable or the file is plain XML.
    }
    const rawPlist = await fs.readFile(plistPath, 'utf-8').catch(() => '');
    const match = rawPlist.match(/<key>\s*CFBundleIdentifier\s*<\/key>\s*<string>\s*([^<\s][^<]*)\s*<\/string>/);
    if (match?.[1]) {
        return match[1].trim();
    }
    throw new Error(`Unable to resolve the iOS bundle ID from ${appPath}. CFBundleIdentifier was not found in ${plistPath}.`);
}
async function findIOSInfoPlist(appPath) {
    const candidates = [
        path.join(appPath, 'Info.plist'),
        path.join(appPath, 'Contents', 'Info.plist'),
    ];
    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }
    return null;
}
async function resolveAndroidToolCandidates(toolName) {
    const candidates = [];
    const androidSdkRoots = [
        process.env['ANDROID_HOME'],
        process.env['ANDROID_SDK_ROOT'],
    ].filter((value) => Boolean(value));
    for (const androidSdkRoot of androidSdkRoots) {
        if (toolName === 'aapt') {
            const buildToolsDir = path.join(androidSdkRoot, 'build-tools');
            const versions = await fs.readdir(buildToolsDir).catch(() => []);
            versions
                .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))
                .forEach((version) => {
                candidates.push(path.join(buildToolsDir, version, toolName));
            });
        }
        if (toolName === 'apkanalyzer') {
            candidates.push(path.join(androidSdkRoot, 'cmdline-tools', 'latest', 'bin', toolName));
            candidates.push(path.join(androidSdkRoot, 'tools', 'bin', toolName));
        }
    }
    const resolvedOnPath = await resolveOnPath(toolName);
    if (resolvedOnPath) {
        candidates.push(resolvedOnPath);
    }
    return dedupeExistingPaths(candidates);
}
async function resolveOnPath(command) {
    try {
        const { stdout } = await execFileAsync('which', [command]);
        const resolvedPath = stdout.toString().trim();
        if (!resolvedPath) {
            return null;
        }
        return resolvedPath;
    }
    catch {
        return null;
    }
}
async function dedupeExistingPaths(candidatePaths) {
    const uniquePaths = [];
    const seen = new Set();
    for (const candidatePath of candidatePaths) {
        if (seen.has(candidatePath)) {
            continue;
        }
        seen.add(candidatePath);
        if (await pathExists(candidatePath)) {
            uniquePaths.push(candidatePath);
        }
    }
    return uniquePaths;
}
function formatExecError(commandPath, error) {
    const message = error instanceof Error ? error.message : String(error);
    return `${path.basename(commandPath)} failed: ${message}`;
}
function formatOverridePlatformMismatch(overridePlatform, selectedPlatform) {
    return `App override platform is "${overridePlatform}", but the selected platform is "${selectedPlatform}".`;
}
async function pathExists(candidatePath) {
    try {
        await fs.access(candidatePath);
        return true;
    }
    catch {
        return false;
    }
}
function assertPlainObject(value, label) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must contain a YAML mapping.`);
    }
}
function assertAllowedKeys(value, allowedKeys, label) {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported key "${key}". Supported keys: ${Array.from(allowedKeys).join(', ')}.`);
        }
    }
}
function readOptionalTrimmedString(value, label) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`${label} must be a string.`);
    }
    const normalizedValue = value.trim();
    if (normalizedValue.length === 0) {
        throw new Error(`${label} must not be empty.`);
    }
    return normalizedValue;
}
//# sourceMappingURL=appConfig.js.map