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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkspace = resolveWorkspace;
exports.resolveWorkspaceFromPath = resolveWorkspaceFromPath;
exports.resolveWorkspaceForCommand = resolveWorkspaceForCommand;
exports.ensureWorkspaceDirectories = ensureWorkspaceDirectories;
exports.listRegisteredWorkspaces = listRegisteredWorkspaces;
exports.refreshWorkspaceUsageMetadata = refreshWorkspaceUsageMetadata;
exports.createWorkspaceHash = createWorkspaceHash;
exports.resolveWorkspaceArtifactsRootDir = resolveWorkspaceArtifactsRootDir;
exports.resolveWorkspaceArtifactsDir = resolveWorkspaceArtifactsDir;
exports.assertPathWithinRoot = assertPathWithinRoot;
exports.sanitizeId = sanitizeId;
exports.createRunId = createRunId;
exports.validateAppOverride = validateAppOverride;
exports.isYamlFile = isYamlFile;
exports.resolveSuiteManifestPath = resolveSuiteManifestPath;
exports.resolveEnvironmentFile = resolveEnvironmentFile;
exports.loadWorkspaceConfig = loadWorkspaceConfig;
exports.resolveConfiguredEnvironmentFile = resolveConfiguredEnvironmentFile;
const crypto = __importStar(require("node:crypto"));
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const common_1 = require("@usb-ui-test/common");
const yaml_1 = __importDefault(require("yaml"));
const appConfig_js_1 = require("./appConfig.js");
const env_js_1 = require("./env.js");
const runtimePaths_js_1 = require("./runtimePaths.js");
const workspacePicker_js_1 = require("./workspacePicker.js");
const WORKSPACE_CONFIG_TOP_LEVEL_KEYS = new Set([
    'env',
    'model',
    'reasoning',
    'features',
    'app',
]);
const FEATURE_OVERRIDE_KEYS = new Set(['model', 'reasoning']);
const ALL_FEATURES_SET = new Set(common_1.ALL_FEATURES);
const WORKSPACE_HASH_LENGTH = 16;
async function resolveWorkspace(cwd = process.cwd()) {
    const workspaceRoot = await findWorkspaceRoot(cwd);
    if (workspaceRoot) {
        return finalizeResolvedWorkspace(await buildWorkspace(workspaceRoot));
    }
    throw new Error('Could not find a .usb-ui-test workspace. Run the CLI from a repository containing .usb-ui-test/.');
}
async function resolveWorkspaceFromPath(workspacePath, options) {
    const normalizedPath = workspacePath.trim();
    if (normalizedPath.length === 0) {
        throw new Error('Missing workspace path. Pass --workspace <path>.');
    }
    const resolvedPath = path.resolve(normalizedPath);
    const workspaceRoot = await findWorkspaceRoot(resolvedPath, options?.requireSelectableWorkspace ? isSelectableWorkspaceRoot : isWorkspaceRootCandidate);
    if (workspaceRoot) {
        return buildWorkspace(workspaceRoot);
    }
    throw new Error(`Path is not inside a UsbUiTest workspace: ${resolvedPath}. Pass --workspace <path> that points to a repository containing .usb-ui-test/.`);
}
async function resolveWorkspaceForCommand(params) {
    const cwd = params?.cwd ?? process.cwd();
    const explicitWorkspacePath = params?.workspacePath?.trim();
    let workspace;
    if (explicitWorkspacePath) {
        workspace = await resolveWorkspaceFromPath(explicitWorkspacePath, {
            requireSelectableWorkspace: true,
        });
    }
    else {
        workspace = await tryResolveWorkspace(cwd, {
            requireSelectableWorkspace: true,
        });
        if (!workspace && params?.io?.isTTY) {
            const registeredWorkspaces = await listRegisteredWorkspaces();
            if (registeredWorkspaces.length > 0) {
                const selection = await (0, workspacePicker_js_1.promptForWorkspaceSelection)({
                    heading: 'Select a UsbUiTest workspace',
                    entries: registeredWorkspaces.map((entry) => ({
                        label: entry.displayName,
                        workspaceRoot: entry.workspace.rootDir,
                    })),
                    io: params.io,
                });
                workspace = await resolveWorkspaceFromPath(selection.workspaceRoot);
            }
        }
    }
    if (!workspace) {
        throw new Error(`Could not find a .usb-ui-test workspace from ${path.resolve(cwd)}. Pass --workspace <path> to target a UsbUiTest workspace explicitly.`);
    }
    return finalizeResolvedWorkspace(workspace);
}
async function finalizeResolvedWorkspace(workspace) {
    await ensureWorkspaceDirectories(workspace);
    await refreshWorkspaceUsageMetadata(workspace);
    return workspace;
}
async function ensureWorkspaceDirectories(workspace) {
    if (!(await pathExists(workspace.testsDir))) {
        throw new Error(`Missing .usb-ui-test/tests directory: ${workspace.testsDir}`);
    }
    await fs.mkdir(workspace.artifactsDir, { recursive: true });
    await writeWorkspaceArtifactMetadata(workspace);
}
async function listRegisteredWorkspaces() {
    const workspaceRegistryRoot = resolveWorkspaceArtifactsRootDir();
    const entries = await fs.readdir(workspaceRegistryRoot, { withFileTypes: true }).catch(() => []);
    const registeredWorkspaces = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const metadataPath = path.join(workspaceRegistryRoot, entry.name, 'workspace.json');
        const metadata = await readWorkspaceMetadataFromPath(metadataPath);
        if (!metadata?.workspaceRoot) {
            continue;
        }
        const workspace = await buildWorkspace(metadata.workspaceRoot);
        if (!(await isSelectableRegisteredWorkspace(workspace))) {
            continue;
        }
        let displayName = normalizeMetadataString(metadata.displayName);
        if (!displayName) {
            displayName = await deriveWorkspaceDisplayName(workspace.rootDir);
            await writeWorkspaceArtifactMetadata(workspace, {
                displayName,
                lastUsedAt: metadata.lastUsedAt,
            });
        }
        registeredWorkspaces.push({
            workspace,
            displayName,
            lastUsedAt: normalizeMetadataString(metadata.lastUsedAt),
            metadataPath,
        });
    }
    registeredWorkspaces.sort(compareRegisteredWorkspaces);
    return registeredWorkspaces;
}
async function refreshWorkspaceUsageMetadata(workspace) {
    const existingMetadata = await readWorkspaceArtifactMetadata(workspace);
    const displayName = normalizeMetadataString(existingMetadata?.displayName) ??
        (await deriveWorkspaceDisplayName(workspace.rootDir));
    return writeWorkspaceArtifactMetadata(workspace, {
        displayName,
        lastUsedAt: new Date().toISOString(),
    });
}
async function createWorkspaceHash(workspaceRoot) {
    const canonicalRoot = await resolveCanonicalWorkspaceRoot(workspaceRoot);
    return crypto
        .createHash('sha256')
        .update(normalizeWorkspaceRootForHash(canonicalRoot))
        .digest('hex')
        .slice(0, WORKSPACE_HASH_LENGTH);
}
function resolveWorkspaceArtifactsRootDir() {
    return path.join((0, runtimePaths_js_1.resolveUsbUiTestRootDir)(), 'workspaces');
}
async function resolveWorkspaceArtifactsDir(workspaceRoot) {
    return path.join(resolveWorkspaceArtifactsRootDir(), await createWorkspaceHash(workspaceRoot), 'artifacts');
}
function assertPathWithinRoot(rootDir, candidatePath, description) {
    const relative = path.relative(rootDir, candidatePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`${description} must stay inside ${rootDir}`);
    }
}
function sanitizeId(relativePath) {
    return relativePath
        .replace(/\.[^.]+$/, '')
        .replace(/[\\/]+/g, '__')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/-+/g, '-');
}
function createRunId(params) {
    const timestamp = params.startedAt.toISOString().replace(/[:]/g, '-');
    return `${timestamp}-${params.envName}-${params.platform}`;
}
async function validateAppOverride(appPath, platform) {
    const resolvedPath = path.resolve(appPath);
    const stats = await fs.stat(resolvedPath).catch(() => null);
    if (!stats) {
        throw new Error(`App override not found: ${resolvedPath}`);
    }
    const lowerPath = resolvedPath.toLowerCase();
    if (lowerPath.endsWith('.apk')) {
        if (!stats.isFile()) {
            throw new Error('Android .apk overrides must point to an APK file.');
        }
        if (platform && platform !== common_1.PLATFORM_ANDROID) {
            throw new Error('Android .apk overrides require --platform android.');
        }
        return {
            appPath: resolvedPath,
            inferredPlatform: common_1.PLATFORM_ANDROID,
        };
    }
    if (lowerPath.endsWith('.app')) {
        if (!stats.isDirectory()) {
            throw new Error('iOS .app overrides must point to an extracted .app bundle directory.');
        }
        if (platform && platform !== common_1.PLATFORM_IOS) {
            throw new Error('iOS .app overrides require --platform ios.');
        }
        return {
            appPath: resolvedPath,
            inferredPlatform: common_1.PLATFORM_IOS,
        };
    }
    throw new Error('Unsupported --app override. Expected an Android .apk or iOS simulator .app.');
}
function isYamlFile(filePath) {
    return /\.ya?ml$/i.test(filePath);
}
async function resolveSuiteManifestPath(suitesDir, suitePath) {
    if (!(await pathExists(suitesDir))) {
        throw new Error(`Missing .usb-ui-test/suites directory: ${suitesDir}`);
    }
    const resolvedPath = resolveWorkspaceScopedPath(suitePath, suitesDir, '.usb-ui-test/suites/');
    assertPathWithinRoot(suitesDir, resolvedPath, 'Suite manifest');
    if (!isYamlFile(resolvedPath)) {
        throw new Error(`Suite manifest must point to a .yaml or .yml file: ${suitePath}`);
    }
    const stats = await fs.stat(resolvedPath).catch(() => null);
    if (!stats?.isFile()) {
        throw new Error(`Suite manifest not found: ${resolvedPath}`);
    }
    return resolvedPath;
}
async function resolveEnvironmentFile(envDir, requestedEnvName) {
    const envDirExists = await pathExists(envDir);
    const environmentFiles = await listEnvironmentFiles(envDir);
    const availableEnvNames = environmentFiles.map((entry) => entry.envName);
    const duplicateNames = findDuplicateEnvironmentNames(availableEnvNames);
    if (duplicateNames.length > 0) {
        throw new Error(`Environment files in ${envDir} contain duplicate names: ${duplicateNames.join(', ')}.`);
    }
    if (requestedEnvName) {
        const explicitMatch = environmentFiles.find((entry) => entry.envName === requestedEnvName);
        if (!explicitMatch) {
            throw new Error(formatMissingEnvironmentError(envDir, requestedEnvName, availableEnvNames, envDirExists));
        }
        return {
            envName: explicitMatch.envName,
            envPath: explicitMatch.envPath,
            availableEnvNames,
            usesEmptyBindings: false,
        };
    }
    if (environmentFiles.length === 0) {
        return {
            envName: 'none',
            availableEnvNames,
            usesEmptyBindings: true,
        };
    }
    const devMatch = environmentFiles.find((entry) => entry.envName === 'dev');
    if (devMatch) {
        return {
            envName: devMatch.envName,
            envPath: devMatch.envPath,
            availableEnvNames,
            usesEmptyBindings: false,
        };
    }
    if (environmentFiles.length === 1) {
        return {
            envName: environmentFiles[0].envName,
            envPath: environmentFiles[0].envPath,
            availableEnvNames,
            usesEmptyBindings: false,
        };
    }
    throw new Error(`Multiple environments are available in ${envDir}. Pass --env <name>. Available environments: ${availableEnvNames.join(', ')}`);
}
async function loadWorkspaceConfig(usbUiTestDir) {
    const configPath = path.join(usbUiTestDir, 'config.yaml');
    if (!(await pathExists(configPath))) {
        return {};
    }
    const raw = await fs.readFile(configPath, 'utf-8').catch(() => {
        throw new Error(`Workspace config file not found: ${configPath}`);
    });
    const parsed = parseYamlDocument(raw, configPath);
    if (parsed === undefined || parsed === null) {
        return {};
    }
    assertPlainObject(parsed, `Workspace config ${configPath}`);
    assertAllowedKeys(parsed, WORKSPACE_CONFIG_TOP_LEVEL_KEYS, `Workspace config ${configPath}`);
    return {
        env: readOptionalTrimmedString(parsed['env'], `${configPath} env`, {
            allowEmpty: false,
        }),
        model: readOptionalTrimmedString(parsed['model'], `${configPath} model`, {
            allowEmpty: true,
        }),
        reasoning: (0, env_js_1.parseReasoningLevel)(parsed['reasoning'], `${configPath} reasoning`),
        features: readFeaturesConfig(parsed['features'], `${configPath} features`),
        app: (0, appConfig_js_1.readAppConfig)(parsed['app'], `${configPath} app`),
    };
}
function readFeaturesConfig(value, label) {
    if (value === undefined || value === null) {
        return undefined;
    }
    assertPlainObject(value, label);
    assertAllowedKeys(value, ALL_FEATURES_SET, label);
    const overrides = {};
    for (const [featureKey, rawOverride] of Object.entries(value)) {
        if (rawOverride === undefined || rawOverride === null) {
            continue;
        }
        const featureLabel = `${label}.${featureKey}`;
        assertPlainObject(rawOverride, featureLabel);
        assertAllowedKeys(rawOverride, FEATURE_OVERRIDE_KEYS, featureLabel);
        const override = {};
        const model = readOptionalTrimmedString(rawOverride['model'], `${featureLabel}.model`, {
            allowEmpty: false,
        });
        if (model !== undefined) {
            override.model = model;
        }
        const reasoning = (0, env_js_1.parseReasoningLevel)(rawOverride['reasoning'], `${featureLabel}.reasoning`);
        if (reasoning !== undefined) {
            override.reasoning = reasoning;
        }
        if (override.model !== undefined || override.reasoning !== undefined) {
            overrides[featureKey] = override;
        }
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
}
async function resolveConfiguredEnvironmentFile(workspace, requestedEnvName) {
    const workspaceConfig = await loadWorkspaceConfig(workspace.usbUiTestDir);
    return resolveEnvironmentFile(workspace.envDir, requestedEnvName ?? workspaceConfig.env);
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
async function writeWorkspaceArtifactMetadata(workspace, updates = {}) {
    const canonicalWorkspaceRoot = await resolveCanonicalWorkspaceRoot(workspace.rootDir);
    const workspaceHash = await createWorkspaceHash(workspace.rootDir);
    const metadataPath = getWorkspaceMetadataPath(workspace);
    const existingMetadata = await readWorkspaceMetadataFromPath(metadataPath);
    const metadata = {
        schemaVersion: 1,
        workspaceRoot: workspace.rootDir,
        canonicalWorkspaceRoot,
        workspaceHash,
        artifactsDir: workspace.artifactsDir,
    };
    const displayName = normalizeMetadataString(updates.displayName ?? existingMetadata?.displayName);
    const lastUsedAt = normalizeMetadataString(updates.lastUsedAt ?? existingMetadata?.lastUsedAt);
    if (displayName) {
        metadata.displayName = displayName;
    }
    if (lastUsedAt) {
        metadata.lastUsedAt = lastUsedAt;
    }
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf-8');
    return metadata;
}
async function resolveCanonicalWorkspaceRoot(workspaceRoot) {
    const resolvedRoot = path.resolve(workspaceRoot);
    try {
        return await fs.realpath(resolvedRoot);
    }
    catch {
        return resolvedRoot;
    }
}
function normalizeWorkspaceRootForHash(workspaceRoot) {
    return process.platform === 'win32' ? workspaceRoot.toLowerCase() : workspaceRoot;
}
async function tryResolveWorkspace(cwd, options) {
    const workspaceRoot = await findWorkspaceRoot(cwd, options?.requireSelectableWorkspace ? isSelectableWorkspaceRoot : isWorkspaceRootCandidate);
    return workspaceRoot ? buildWorkspace(workspaceRoot) : undefined;
}
async function buildWorkspace(workspaceRoot) {
    const rootDir = path.resolve(workspaceRoot);
    const usbUiTestDir = path.join(rootDir, '.usb-ui-test');
    return {
        rootDir,
        usbUiTestDir,
        testsDir: path.join(usbUiTestDir, 'tests'),
        suitesDir: path.join(usbUiTestDir, 'suites'),
        envDir: path.join(usbUiTestDir, 'env'),
        artifactsDir: await resolveWorkspaceArtifactsDir(rootDir),
    };
}
async function findWorkspaceRoot(startPath, isWorkspaceRoot = isWorkspaceRootCandidate) {
    const resolvedStartPath = path.resolve(startPath);
    const stats = await fs.stat(resolvedStartPath).catch(() => null);
    let currentDir = stats?.isFile() ? path.dirname(resolvedStartPath) : resolvedStartPath;
    while (true) {
        if (await isWorkspaceRoot(currentDir)) {
            return currentDir;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            return undefined;
        }
        currentDir = parentDir;
    }
}
async function readWorkspaceArtifactMetadata(workspace) {
    return readWorkspaceMetadataFromPath(getWorkspaceMetadataPath(workspace));
}
async function readWorkspaceMetadataFromPath(metadataPath) {
    try {
        const raw = await fs.readFile(metadataPath, 'utf-8');
        return parseWorkspaceMetadataRecord(JSON.parse(raw));
    }
    catch {
        return undefined;
    }
}
function getWorkspaceMetadataPath(workspace) {
    return path.join(workspace.artifactsDir, '..', 'workspace.json');
}
async function isSelectableRegisteredWorkspace(workspace) {
    return isSelectableWorkspaceRoot(workspace.rootDir);
}
async function isDirectory(candidatePath) {
    try {
        return (await fs.stat(candidatePath)).isDirectory();
    }
    catch {
        return false;
    }
}
async function isWorkspaceRootCandidate(candidateRoot) {
    return isDirectory(path.join(candidateRoot, '.usb-ui-test'));
}
async function isSelectableWorkspaceRoot(candidateRoot) {
    return (await isWorkspaceRootCandidate(candidateRoot)) &&
        (await isDirectory(path.join(candidateRoot, '.usb-ui-test', 'tests')));
}
function compareRegisteredWorkspaces(left, right) {
    const leftTimestamp = Date.parse(left.lastUsedAt ?? '');
    const rightTimestamp = Date.parse(right.lastUsedAt ?? '');
    const normalizedLeftTimestamp = Number.isNaN(leftTimestamp) ? 0 : leftTimestamp;
    const normalizedRightTimestamp = Number.isNaN(rightTimestamp) ? 0 : rightTimestamp;
    if (normalizedRightTimestamp !== normalizedLeftTimestamp) {
        return normalizedRightTimestamp - normalizedLeftTimestamp;
    }
    const labelOrder = left.displayName.localeCompare(right.displayName);
    if (labelOrder !== 0) {
        return labelOrder;
    }
    return left.workspace.rootDir.localeCompare(right.workspace.rootDir);
}
async function deriveWorkspaceDisplayName(workspaceRoot) {
    const packageName = await readWorkspacePackageName(workspaceRoot);
    if (packageName) {
        return packageName;
    }
    const originSlug = readWorkspaceOriginRepoSlug(workspaceRoot);
    if (originSlug) {
        return originSlug;
    }
    return path.basename(workspaceRoot);
}
async function readWorkspacePackageName(workspaceRoot) {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    try {
        const raw = await fs.readFile(packageJsonPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return typeof parsed.name === 'string' && parsed.name.trim().length > 0
            ? parsed.name.trim()
            : undefined;
    }
    catch {
        return undefined;
    }
}
function readWorkspaceOriginRepoSlug(workspaceRoot) {
    const result = (0, node_child_process_1.spawnSync)('git', ['config', '--get', 'remote.origin.url'], {
        cwd: workspaceRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
    });
    if (result.status !== 0) {
        return undefined;
    }
    return parseGitOriginRepoSlug(result.stdout);
}
function parseGitOriginRepoSlug(remoteUrl) {
    const normalizedRemoteUrl = remoteUrl.trim();
    if (normalizedRemoteUrl.length === 0) {
        return undefined;
    }
    try {
        return normalizeRepoSlugPath(new URL(normalizedRemoteUrl).pathname);
    }
    catch {
        const scpStyleMatch = /^(?:.+@)?[^:]+:(.+)$/.exec(normalizedRemoteUrl);
        if (scpStyleMatch) {
            return normalizeRepoSlugPath(scpStyleMatch[1]);
        }
        return undefined;
    }
}
function normalizeRepoSlugPath(value) {
    const normalizedValue = value.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\.git$/, '');
    return normalizedValue.length > 0 ? normalizedValue : undefined;
}
function normalizeMetadataString(value) {
    const normalizedValue = value?.trim();
    return normalizedValue && normalizedValue.length > 0 ? normalizedValue : undefined;
}
function parseWorkspaceMetadataRecord(value) {
    if (!isObjectRecord(value)) {
        return undefined;
    }
    const workspaceRoot = readMetadataPathString(value.workspaceRoot);
    const canonicalWorkspaceRoot = readMetadataPathString(value.canonicalWorkspaceRoot);
    const workspaceHash = readMetadataString(value.workspaceHash);
    const artifactsDir = readMetadataPathString(value.artifactsDir);
    if (!workspaceRoot || !canonicalWorkspaceRoot || !workspaceHash || !artifactsDir) {
        return undefined;
    }
    const schemaVersion = typeof value.schemaVersion === 'number' &&
        Number.isInteger(value.schemaVersion) &&
        value.schemaVersion > 0
        ? value.schemaVersion
        : 1;
    const metadata = {
        schemaVersion,
        workspaceRoot,
        canonicalWorkspaceRoot,
        workspaceHash,
        artifactsDir,
    };
    const displayName = readMetadataString(value.displayName);
    const lastUsedAt = readMetadataString(value.lastUsedAt);
    if (displayName) {
        metadata.displayName = displayName;
    }
    if (lastUsedAt) {
        metadata.lastUsedAt = lastUsedAt;
    }
    return metadata;
}
function isObjectRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readMetadataString(value) {
    return typeof value === 'string' ? normalizeMetadataString(value) : undefined;
}
function readMetadataPathString(value) {
    const normalizedValue = readMetadataString(value);
    return normalizedValue ? path.resolve(normalizedValue) : undefined;
}
async function listEnvironmentFiles(envDir) {
    if (!(await pathExists(envDir))) {
        return [];
    }
    const entries = await fs.readdir(envDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && isYamlFile(entry.name))
        .map((entry) => ({
        envName: path.basename(entry.name, path.extname(entry.name)),
        envPath: path.join(envDir, entry.name),
    }))
        .sort((left, right) => left.envName.localeCompare(right.envName));
}
function findDuplicateEnvironmentNames(envNames) {
    const counts = new Map();
    for (const envName of envNames) {
        counts.set(envName, (counts.get(envName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([envName]) => envName)
        .sort((left, right) => left.localeCompare(right));
}
function formatMissingEnvironmentError(envDir, requestedEnvName, availableEnvNames, envDirExists) {
    if (!envDirExists) {
        return `Environment "${requestedEnvName}" was requested, but ${envDir} does not exist. Create .usb-ui-test/env/${requestedEnvName}.yaml or omit --env for env-free tests.`;
    }
    if (availableEnvNames.length === 0) {
        return `Environment "${requestedEnvName}" was not found in ${envDir}, and no environment files are available there. Create .usb-ui-test/env/${requestedEnvName}.yaml or omit --env for env-free tests.`;
    }
    return `Environment "${requestedEnvName}" was not found in ${envDir}. Available environments: ${availableEnvNames.join(', ')}`;
}
function resolveWorkspaceScopedPath(candidatePath, scopedRootDir, workspacePrefix) {
    const normalizedCandidatePath = candidatePath.split(path.sep).join('/');
    const workspaceRoot = path.resolve(scopedRootDir, '..', '..');
    if (path.isAbsolute(candidatePath)) {
        return path.resolve(candidatePath);
    }
    if (normalizedCandidatePath.startsWith(workspacePrefix)) {
        return path.resolve(workspaceRoot, candidatePath);
    }
    return path.resolve(scopedRootDir, candidatePath);
}
function parseYamlDocument(raw, filePath) {
    const document = yaml_1.default.parseDocument(raw);
    if (document.errors.length > 0) {
        const firstError = document.errors[0];
        throw new Error(`Invalid YAML in ${filePath}: ${firstError.message}`);
    }
    return document.toJS();
}
function assertPlainObject(value, label) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must contain a YAML mapping at the top level.`);
    }
}
function assertAllowedKeys(value, allowedKeys, label) {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported key "${key}". Supported keys: ${Array.from(allowedKeys).join(', ')}.`);
        }
    }
}
function readOptionalTrimmedString(value, label, options) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`${label} must be a string.`);
    }
    const normalizedValue = value.trim();
    if (!options?.allowEmpty && normalizedValue.length === 0) {
        throw new Error(`${label} must not be empty.`);
    }
    return normalizedValue;
}
//# sourceMappingURL=workspace.js.map