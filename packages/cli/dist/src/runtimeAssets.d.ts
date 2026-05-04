export type RuntimeAssetKind = 'android-driver-apk' | 'android-driver-test-apk' | 'ios-driver-archive' | 'ios-driver-runner-archive';
export interface RuntimeAssetManifestRecord {
    version: string;
    assets: RuntimeAssetRecord[];
}
export interface RuntimeAssetRecord {
    kind: RuntimeAssetKind;
    platform: 'android' | 'ios';
    filename: string;
    url: string;
    sha256: string;
    size: number;
    relativePath?: string;
}
interface RuntimeAssetStoreOptions {
    downloadAssets?: boolean;
}
export declare class RuntimeAssetStore {
    private readonly _resourceDir;
    private readonly _downloadAssets;
    private _manifestPromise;
    constructor(resourceDir?: string, options?: RuntimeAssetStoreOptions);
    getResourceDir(): string;
    resolveAssetPath(kind: RuntimeAssetKind): Promise<string | null>;
    private _loadManifest;
    private _isValidAssetFile;
    private _readAssetBytes;
}
export {};
//# sourceMappingURL=runtimeAssets.d.ts.map