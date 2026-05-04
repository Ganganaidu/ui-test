"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApiKey = resolveApiKey;
exports.resolveApiKeys = resolveApiKeys;
const env_js_1 = require("./env.js");
function resolveApiKey(params) {
    if (params.providedApiKey) {
        return params.providedApiKey;
    }
    const providerEnvVar = env_js_1.PROVIDER_ENV_VARS[params.provider];
    const apiKey = providerEnvVar ? params.env.get(providerEnvVar) : undefined;
    if (!apiKey) {
        throw new Error(buildMissingApiKeyError(params.provider, providerEnvVar));
    }
    return apiKey;
}
/**
 * Resolve API keys for every provider referenced by the current run.
 *
 * --api-key is accepted only when a single provider is in play; mixing
 * providers across features requires env vars per provider (documented in
 * docs/environment.md) so we can't silently pair one key with multiple
 * providers.
 */
function resolveApiKeys(params) {
    const providers = Array.from(new Set(params.providers));
    if (providers.length === 0) {
        throw new Error('At least one provider must be specified when resolving API keys.');
    }
    // Match `resolveApiKey` semantics: an empty/whitespace --api-key value
    // falls through to env-var lookup rather than being treated as "this is
    // the key." Keeps the two resolvers consistent.
    if (params.providedApiKey) {
        if (providers.length > 1) {
            throw new Error(`--api-key is only valid when a single provider is active. This run uses multiple providers (${providers.join(', ')}). Provide the per-provider env vars instead: ${providers
                .map((p) => env_js_1.PROVIDER_ENV_VARS[p] ?? `<${p}>`)
                .join(', ')}.`);
        }
        return { [providers[0]]: params.providedApiKey };
    }
    const resolved = {};
    const missing = [];
    for (const provider of providers) {
        const providerEnvVar = env_js_1.PROVIDER_ENV_VARS[provider];
        const apiKey = providerEnvVar ? params.env.get(providerEnvVar) : undefined;
        if (!apiKey) {
            missing.push({ provider, envVar: providerEnvVar });
            continue;
        }
        resolved[provider] = apiKey;
    }
    if (missing.length > 0) {
        throw new Error(buildMissingApiKeysError(missing));
    }
    return resolved;
}
function buildMissingApiKeyError(provider, providerEnvVar) {
    if (providerEnvVar) {
        return `API key is required for provider "${provider}". Provide via --api-key or ${providerEnvVar}.`;
    }
    return `API key is required for provider "${provider}". Provide via --api-key.`;
}
function buildMissingApiKeysError(missing) {
    if (missing.length === 1) {
        const entry = missing[0];
        return buildMissingApiKeyError(entry.provider, entry.envVar);
    }
    const detail = missing
        .map(({ provider, envVar }) => (envVar ? `${provider} (${envVar})` : provider))
        .join(', ');
    return `API keys are required for multiple providers. Set the following env vars: ${detail}.`;
}
//# sourceMappingURL=apiKey.js.map