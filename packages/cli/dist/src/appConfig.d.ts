import { PLATFORM_ANDROID, PLATFORM_IOS, type AppConfig } from '@usb-ui-test/common';
type SupportedPlatform = typeof PLATFORM_ANDROID | typeof PLATFORM_IOS;
export interface ResolvedAppConfig {
    platform: SupportedPlatform;
    identifier: string;
    identifierKind: 'packageName' | 'bundleId';
    name?: string;
    sourceEnvName?: string;
}
export interface ValidatedAppOverrideLike {
    appPath: string;
    inferredPlatform: string;
    resolvedIdentifier?: string;
}
export declare function readAppConfig(value: unknown, label: string): AppConfig | undefined;
export declare function resolveAppConfig(params: {
    workspaceApp: AppConfig | undefined;
    environmentApp?: AppConfig;
    envName: string;
    requestedPlatform?: string;
    appOverride?: ValidatedAppOverrideLike;
}): ResolvedAppConfig;
export declare function formatResolvedAppSummary(app: ResolvedAppConfig): string;
export declare function resolveAppOverrideIdentifier(appOverride: ValidatedAppOverrideLike): Promise<string>;
export {};
//# sourceMappingURL=appConfig.d.ts.map