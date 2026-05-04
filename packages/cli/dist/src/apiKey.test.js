"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = __importDefault(require("node:test"));
const env_js_1 = require("./env.js");
const apiKey_js_1 = require("./apiKey.js");
function createEnv(values) {
    return {
        get(key) {
            return values[key];
        },
    };
}
(0, node_test_1.default)('resolveApiKey prefers the env var that matches the selected provider', () => {
    const apiKey = (0, apiKey_js_1.resolveApiKey)({
        env: createEnv({
            OPENAI_API_KEY: 'openai-key',
            GOOGLE_API_KEY: 'google-key',
            ANTHROPIC_API_KEY: 'anthropic-key',
        }),
        provider: 'google',
    });
    strict_1.default.equal(apiKey, 'google-key');
});
(0, node_test_1.default)('resolveApiKey lets --api-key override environment variables', () => {
    const apiKey = (0, apiKey_js_1.resolveApiKey)({
        env: createEnv({
            GOOGLE_API_KEY: 'google-key',
        }),
        provider: 'google',
        providedApiKey: 'flag-key',
    });
    strict_1.default.equal(apiKey, 'flag-key');
});
(0, node_test_1.default)('resolveApiKey reads provider-specific env vars loaded from .env and .env.<env>', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-api-key-env-files-'));
    const env = new env_js_1.CliEnv();
    try {
        await promises_1.default.writeFile(node_path_1.default.join(rootDir, '.env'), 'OPENAI_API_KEY=base-key\n', 'utf-8');
        await promises_1.default.writeFile(node_path_1.default.join(rootDir, '.env.dev'), 'OPENAI_API_KEY=dev-key\n', 'utf-8');
        env.load('dev', {
            cwd: rootDir,
            processEnv: {},
        });
        strict_1.default.equal((0, apiKey_js_1.resolveApiKey)({
            env,
            provider: 'openai',
        }), 'dev-key');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('resolveApiKey prefers process env over .env files for the selected provider', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-api-key-process-env-'));
    const env = new env_js_1.CliEnv();
    try {
        await promises_1.default.writeFile(node_path_1.default.join(rootDir, '.env'), 'GOOGLE_API_KEY=file-key\n', 'utf-8');
        env.load(undefined, {
            cwd: rootDir,
            processEnv: {
                GOOGLE_API_KEY: 'process-key',
            },
        });
        strict_1.default.equal((0, apiKey_js_1.resolveApiKey)({
            env,
            provider: 'google',
        }), 'process-key');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('resolveApiKey no longer accepts API_KEY as a shared fallback', () => {
    strict_1.default.throws(() => (0, apiKey_js_1.resolveApiKey)({
        env: createEnv({
            API_KEY: 'shared-key',
        }),
        provider: 'anthropic',
    }), /Provide via --api-key or ANTHROPIC_API_KEY/);
});
(0, node_test_1.default)('resolveApiKey reports the provider-matched env var in its error message', () => {
    strict_1.default.throws(() => (0, apiKey_js_1.resolveApiKey)({
        env: createEnv({}),
        provider: 'google',
    }), /Provide via --api-key or GOOGLE_API_KEY/);
});
(0, node_test_1.default)('resolveApiKeys returns a per-provider map from env vars', () => {
    const env = createEnv({
        OPENAI_API_KEY: 'openai-key',
        GOOGLE_API_KEY: 'google-key',
        ANTHROPIC_API_KEY: 'anthropic-key',
    });
    const keys = (0, apiKey_js_1.resolveApiKeys)({
        env,
        providers: new Set(['openai', 'google']),
    });
    strict_1.default.deepEqual(keys, {
        openai: 'openai-key',
        google: 'google-key',
    });
});
(0, node_test_1.default)('resolveApiKeys routes --api-key to the single active provider', () => {
    const keys = (0, apiKey_js_1.resolveApiKeys)({
        env: createEnv({}),
        providers: ['openai'],
        providedApiKey: 'flag-key',
    });
    strict_1.default.deepEqual(keys, { openai: 'flag-key' });
});
(0, node_test_1.default)('resolveApiKeys treats empty --api-key as unset and falls through to env vars', () => {
    const keys = (0, apiKey_js_1.resolveApiKeys)({
        env: createEnv({ OPENAI_API_KEY: 'env-key' }),
        providers: ['openai'],
        providedApiKey: '',
    });
    strict_1.default.deepEqual(keys, { openai: 'env-key' });
});
(0, node_test_1.default)('resolveApiKeys rejects --api-key when multiple providers are configured', () => {
    strict_1.default.throws(() => (0, apiKey_js_1.resolveApiKeys)({
        env: createEnv({}),
        providers: ['openai', 'anthropic'],
        providedApiKey: 'flag-key',
    }), /--api-key is only valid when a single provider is active/);
});
(0, node_test_1.default)('resolveApiKeys aggregates missing provider errors into one message', () => {
    strict_1.default.throws(() => (0, apiKey_js_1.resolveApiKeys)({
        env: createEnv({ OPENAI_API_KEY: 'openai-key' }),
        providers: ['openai', 'google', 'anthropic'],
    }), /google \(GOOGLE_API_KEY\), anthropic \(ANTHROPIC_API_KEY\)/);
});
//# sourceMappingURL=apiKey.test.js.map