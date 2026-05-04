import type { StructuredStep } from './types.js';
/**
 * Returns 'deterministic' if every entry in `steps` is a YAML mapping with a
 * recognized command key. Returns 'ai' if every entry is a string. Throws on
 * mixed input — we don't try to be clever about half-typed files because the
 * resulting test would be confusing to debug.
 */
export declare function detectMode(steps: unknown[]): 'deterministic' | 'ai';
/**
 * Parse a list of raw YAML step entries into StructuredStep objects.
 * Caller has already established this file is deterministic (via detectMode).
 */
export declare function parseStructuredSteps(rawSteps: unknown[]): StructuredStep[];
//# sourceMappingURL=parser.d.ts.map