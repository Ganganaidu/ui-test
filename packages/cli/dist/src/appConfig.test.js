"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = __importDefault(require("node:test"));
const appConfig_js_1 = require("./appConfig.js");
async function withEnv(overrides, callback) {
    const previousValues = new Map();
    for (const [key, value] of Object.entries(overrides)) {
        previousValues.set(key, process.env[key]);
        if (value === undefined) {
            delete process.env[key];
        }
        else {
            process.env[key] = value;
        }
    }
    try {
        return await callback();
    }
    finally {
        for (const [key, value] of previousValues.entries()) {
            if (value === undefined) {
                delete process.env[key];
            }
            else {
                process.env[key] = value;
            }
        }
    }
}
(0, node_test_1.default)('resolveAppConfig rejects conflicting requested and inferred platforms', () => {
    strict_1.default.throws(() => (0, appConfig_js_1.resolveAppConfig)({
        workspaceApp: {
            packageName: 'org.wikipedia.android',
            bundleId: 'org.wikipedia.ios',
        },
        envName: 'none',
        requestedPlatform: 'ios',
        appOverride: {
            appPath: '/tmp/wikipedia.apk',
            inferredPlatform: 'android',
        },
    }), /App override platform is "android", but the selected platform is "ios"\./);
});
(0, node_test_1.default)('resolveAppConfig infers android from the override platform when both identifiers are configured', () => {
    const resolved = (0, appConfig_js_1.resolveAppConfig)({
        workspaceApp: {
            packageName: 'org.wikipedia.android',
            bundleId: 'org.wikipedia.ios',
        },
        envName: 'none',
        appOverride: {
            appPath: '/tmp/wikipedia.apk',
            inferredPlatform: 'android',
        },
    });
    strict_1.default.deepEqual(resolved, {
        platform: 'android',
        identifier: 'org.wikipedia.android',
        identifierKind: 'packageName',
        name: undefined,
        sourceEnvName: undefined,
    });
});
(0, node_test_1.default)('resolveAppConfig treats env app config as a full replacement', () => {
    const resolved = (0, appConfig_js_1.resolveAppConfig)({
        workspaceApp: {
            name: 'Wikipedia',
            packageName: 'org.wikipedia.android',
            bundleId: 'org.wikipedia.ios',
        },
        environmentApp: {
            packageName: 'org.wikipedia.beta',
        },
        envName: 'staging',
    });
    strict_1.default.deepEqual(resolved, {
        platform: 'android',
        identifier: 'org.wikipedia.beta',
        identifierKind: 'packageName',
        name: undefined,
        sourceEnvName: 'staging',
    });
});
(0, node_test_1.default)('resolveAppOverrideIdentifier falls back to ANDROID_SDK_ROOT when ANDROID_HOME has no tools', async () => {
    const tempDir = await promises_1.default.mkdtemp(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-app-config-'));
    const staleSdkRoot = node_path_1.default.join(tempDir, 'stale-sdk');
    const validSdkRoot = node_path_1.default.join(tempDir, 'valid-sdk');
    const buildToolsDir = node_path_1.default.join(validSdkRoot, 'build-tools', '35.0.0');
    const fakeAaptPath = node_path_1.default.join(buildToolsDir, 'aapt');
    const appPath = node_path_1.default.join(tempDir, 'Wikipedia.apk');
    try {
        await promises_1.default.mkdir(staleSdkRoot, { recursive: true });
        await promises_1.default.mkdir(buildToolsDir, { recursive: true });
        await promises_1.default.writeFile(fakeAaptPath, ['#!/bin/sh', 'printf "package: name=\'org.wikipedia.beta\'\\n"'].join('\n'), 'utf-8');
        await promises_1.default.chmod(fakeAaptPath, 0o755);
        await promises_1.default.writeFile(appPath, '', 'utf-8');
        const packageName = await withEnv({
            ANDROID_HOME: staleSdkRoot,
            ANDROID_SDK_ROOT: validSdkRoot,
            PATH: '',
        }, async () => await (0, appConfig_js_1.resolveAppOverrideIdentifier)({
            appPath,
            inferredPlatform: 'android',
        }));
        strict_1.default.equal(packageName, 'org.wikipedia.beta');
    }
    finally {
        await promises_1.default.rm(tempDir, { recursive: true, force: true });
    }
});
//# sourceMappingURL=appConfig.test.js.map