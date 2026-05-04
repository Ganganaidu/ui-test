export declare class LocalRuntimeMissingError extends Error {
    readonly exitCode = 1;
    readonly cliVersion: string;
    readonly runtimeRoot: string;
    constructor(cliVersion: string, runtimeRoot: string);
}
export interface LocalRuntime {
    testRunner: typeof import('./testRunner.js');
    doctorRunner: typeof import('./doctorRunner.js');
    reportServer: typeof import('./reportServer.js');
    reportServerManager: typeof import('./reportServerManager.js');
}
export declare function resolveLocalRuntimeRoot(): string;
/**
 * Lazy-load the local-runtime modules. Local commands await it before
 * running their handlers.
 *
 * In a Bun-compiled standalone binary the heavy JS is bundled into the
 * executable but the on-disk assets (driver bundles, gRPC proto, SPA dist)
 * live in the runtime tarball — we require it to be installed and throw
 * LocalRuntimeMissingError with recovery instructions otherwise.
 *
 * In dev / tsc / npm installs the resolver always succeeds because the
 * heavy modules ship in packages/cli's node_modules tree.
 */
export declare function resolveLocalRuntime(): Promise<LocalRuntime>;
/**
 * Heuristic for whether the current process can prompt the user. Used by
 * any code path that wants to ask before doing something heavy (e.g.
 * downloading the runtime tarball). False in CI and any non-TTY context.
 */
export declare function isInteractive(): boolean;
//# sourceMappingURL=localRuntime.d.ts.map