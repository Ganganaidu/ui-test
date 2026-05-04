export interface UpgradeOptions {
    version?: string;
    /** Pass --ci to the installer (binary only, skip runtime tarball + prompts). */
    ci?: boolean;
}
export declare function runUpgrade(options: UpgradeOptions): Promise<void>;
//# sourceMappingURL=upgradeCommand.d.ts.map