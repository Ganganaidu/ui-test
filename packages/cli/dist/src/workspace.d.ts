import { type AppConfig, type FeatureOverrides, type ReasoningLevel } from '@usb-ui-test/common';
import { type WorkspaceSelectionIO } from './workspacePicker.js';
export interface UsbUiTestWorkspace {
    rootDir: string;
    usbUiTestDir: string;
    testsDir: string;
    suitesDir: string;
    envDir: string;
    artifactsDir: string;
}
export interface AppOverrideValidationResult {
    appPath: string;
    inferredPlatform: string;
    resolvedIdentifier?: string;
}
export interface WorkspaceConfig {
    env?: string;
    model?: string;
    reasoning?: ReasoningLevel;
    features?: FeatureOverrides;
    app?: AppConfig;
}
export interface ResolvedEnvironmentFile {
    envName: string;
    envPath?: string;
    availableEnvNames: string[];
    usesEmptyBindings: boolean;
}
export interface WorkspaceMetadataRecord {
    schemaVersion: number;
    workspaceRoot: string;
    canonicalWorkspaceRoot: string;
    workspaceHash: string;
    artifactsDir: string;
    displayName?: string;
    lastUsedAt?: string;
}
export interface RegisteredWorkspaceEntry {
    workspace: UsbUiTestWorkspace;
    displayName: string;
    lastUsedAt?: string;
    metadataPath: string;
}
export declare function resolveWorkspace(cwd?: string): Promise<UsbUiTestWorkspace>;
export declare function resolveWorkspaceFromPath(workspacePath: string, options?: {
    requireSelectableWorkspace?: boolean;
}): Promise<UsbUiTestWorkspace>;
export declare function resolveWorkspaceForCommand(params?: {
    cwd?: string;
    workspacePath?: string;
    io?: WorkspaceSelectionIO;
}): Promise<UsbUiTestWorkspace>;
export declare function ensureWorkspaceDirectories(workspace: UsbUiTestWorkspace): Promise<void>;
export declare function listRegisteredWorkspaces(): Promise<RegisteredWorkspaceEntry[]>;
export declare function refreshWorkspaceUsageMetadata(workspace: UsbUiTestWorkspace): Promise<WorkspaceMetadataRecord>;
export declare function createWorkspaceHash(workspaceRoot: string): Promise<string>;
export declare function resolveWorkspaceArtifactsRootDir(): string;
export declare function resolveWorkspaceArtifactsDir(workspaceRoot: string): Promise<string>;
export declare function assertPathWithinRoot(rootDir: string, candidatePath: string, description: string): void;
export declare function sanitizeId(relativePath: string): string;
export declare function createRunId(params: {
    envName: string;
    platform: string;
    startedAt: Date;
}): string;
export declare function validateAppOverride(appPath: string, platform?: string): Promise<AppOverrideValidationResult>;
export declare function isYamlFile(filePath: string): boolean;
export declare function resolveSuiteManifestPath(suitesDir: string, suitePath: string): Promise<string>;
export declare function resolveEnvironmentFile(envDir: string, requestedEnvName?: string): Promise<ResolvedEnvironmentFile>;
export declare function loadWorkspaceConfig(usbUiTestDir: string): Promise<WorkspaceConfig>;
export declare function resolveConfiguredEnvironmentFile(workspace: UsbUiTestWorkspace, requestedEnvName?: string): Promise<ResolvedEnvironmentFile>;
//# sourceMappingURL=workspace.d.ts.map