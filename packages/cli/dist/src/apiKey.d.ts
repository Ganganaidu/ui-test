import { type CliEnv } from './env.js';
export declare function resolveApiKey(params: {
    env: Pick<CliEnv, 'get'>;
    provider: string;
    providedApiKey?: string;
}): string;
/**
 * Resolve API keys for every provider referenced by the current run.
 *
 * --api-key is accepted only when a single provider is in play; mixing
 * providers across features requires env vars per provider (documented in
 * docs/environment.md) so we can't silently pair one key with multiple
 * providers.
 */
export declare function resolveApiKeys(params: {
    env: Pick<CliEnv, 'get'>;
    providers: Iterable<string>;
    providedApiKey?: string;
}): Record<string, string>;
//# sourceMappingURL=apiKey.d.ts.map