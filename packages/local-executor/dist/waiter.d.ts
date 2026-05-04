import type { Hierarchy } from '@usb-ui-test/common';
export interface WaitOptions {
    /** Total time budget. Defaults to 10000ms. */
    readonly timeoutMs?: number;
    /** Time between polls. Defaults to 200ms. */
    readonly pollIntervalMs?: number;
}
export interface StableOptions extends WaitOptions {
    /** How many consecutive identical polls count as "stable". Defaults to 3. */
    readonly stableCount?: number;
    /** Cap on time spent stabilizing — separate from total timeoutMs. Defaults to 5000ms. */
    readonly stableTimeoutMs?: number;
}
/**
 * Poll the hierarchy until it stops changing for `stableCount` consecutive
 * polls, or until `stableTimeoutMs` elapses. Returns the most recent
 * hierarchy. Never rejects — settling failure isn't a test failure on its own,
 * the next selector lookup will produce the real diagnostic.
 */
export declare function waitUntilStable(fetchHierarchy: () => Promise<Hierarchy>, opts?: StableOptions): Promise<Hierarchy>;
/**
 * Repeatedly fetch the hierarchy and try `predicate(hierarchy)`. Returns the
 * first truthy result. Rejects with the last predicate error on timeout.
 */
export declare function retryUntil<T>(fetchHierarchy: () => Promise<Hierarchy>, predicate: (h: Hierarchy) => T | undefined, opts?: WaitOptions): Promise<T>;
//# sourceMappingURL=waiter.d.ts.map