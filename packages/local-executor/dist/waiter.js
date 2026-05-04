"use strict";
// waiter.ts
//
// Smart-waiting + retry-with-timeout. The deterministic executor uses these
// to absorb the inherent race between "screen transitions in progress" and
// "we already tried to find an element."
//
// Two utilities:
//
// 1. waitUntilStable(fetchHierarchy, opts) — polls the AX tree and resolves
//    once the tree stops changing for N consecutive polls. Used right after a
//    state-changing action (tap, launch) before the next selector lookup.
//
// 2. retryUntil(fetchHierarchy, predicate, opts) — repeatedly grabs the tree
//    and runs `predicate(hierarchy)`; resolves with the first truthy result
//    or rejects on timeout.
//
// Both share the same pace: poll every 200ms by default, with a 10s ceiling.
// Tunable per call site so quick assertions don't pay the full budget.
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUntilStable = waitUntilStable;
exports.retryUntil = retryUntil;
/**
 * Poll the hierarchy until it stops changing for `stableCount` consecutive
 * polls, or until `stableTimeoutMs` elapses. Returns the most recent
 * hierarchy. Never rejects — settling failure isn't a test failure on its own,
 * the next selector lookup will produce the real diagnostic.
 */
async function waitUntilStable(fetchHierarchy, opts = {}) {
    const stableCount = opts.stableCount ?? 3;
    const interval = opts.pollIntervalMs ?? 200;
    const deadline = Date.now() + (opts.stableTimeoutMs ?? 5000);
    let last = await fetchHierarchy();
    let lastFingerprint = fingerprint(last);
    let consecutive = 1;
    while (consecutive < stableCount && Date.now() < deadline) {
        await sleep(interval);
        const next = await fetchHierarchy();
        const fp = fingerprint(next);
        if (fp === lastFingerprint) {
            consecutive++;
        }
        else {
            consecutive = 1;
            lastFingerprint = fp;
        }
        last = next;
    }
    return last;
}
/**
 * Repeatedly fetch the hierarchy and try `predicate(hierarchy)`. Returns the
 * first truthy result. Rejects with the last predicate error on timeout.
 */
async function retryUntil(fetchHierarchy, predicate, opts = {}) {
    const interval = opts.pollIntervalMs ?? 200;
    const deadline = Date.now() + (opts.timeoutMs ?? 10000);
    let lastError;
    while (Date.now() < deadline) {
        let hierarchy;
        try {
            hierarchy = await fetchHierarchy();
        }
        catch (err) {
            lastError = err;
            await sleep(interval);
            continue;
        }
        try {
            const result = predicate(hierarchy);
            if (result !== undefined)
                return result;
        }
        catch (err) {
            lastError = err;
        }
        await sleep(interval);
    }
    throw lastError instanceof Error
        ? lastError
        : new Error(`Timed out after ${opts.timeoutMs ?? 10000}ms${lastError ? `: ${String(lastError)}` : ''}`);
}
/**
 * Compact fingerprint of a hierarchy — used to detect "no change between
 * polls" cheaply. We hash the flattened (id|text|bounds) tuples; this catches
 * navigation and most animation transitions without false positives from
 * focus blinks or text-entry caret moves.
 */
function fingerprint(hierarchy) {
    const parts = [];
    for (const n of hierarchy.flattenedHierarchy) {
        parts.push(`${n.id ?? ''}|${n.text ?? ''}|${n.accessibilityText ?? ''}|${n.bounds ? n.bounds.join(',') : ''}`);
    }
    return parts.join('\n');
}
function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}
//# sourceMappingURL=waiter.js.map