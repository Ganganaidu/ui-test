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
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const checkRunner_js_1 = require("./checkRunner.js");
const workspace_js_1 = require("./workspace.js");
function createTempWorkspace(params) {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-workspace-'));
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    const suitesDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'suites');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    const includeEnvDir = params?.includeEnvDir ?? true;
    if (includeEnvDir) {
        node_fs_1.default.mkdirSync(envDir, { recursive: true });
    }
    const suites = params?.suites ?? {};
    const includeSuitesDir = params?.includeSuitesDir ?? Object.keys(suites).length > 0;
    if (includeSuitesDir) {
        node_fs_1.default.mkdirSync(suitesDir, { recursive: true });
    }
    const configYaml = buildWorkspaceConfigYaml(params?.configYaml);
    if (configYaml !== undefined) {
        node_fs_1.default.writeFileSync(node_path_1.default.join(rootDir, '.usb-ui-test', 'config.yaml'), configYaml, 'utf-8');
    }
    const envFiles = params?.envFiles ?? {
        'dev.yaml': params?.envYaml ?? '{}\n',
    };
    if (includeEnvDir) {
        for (const [fileName, contents] of Object.entries(envFiles)) {
            node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, fileName), contents, 'utf-8');
        }
    }
    const testFiles = params?.testFiles ?? {
        'login.yaml': ['name: login', 'steps:', '  - Open the login screen.'].join('\n'),
    };
    for (const [relativePath, contents] of Object.entries(testFiles)) {
        const targetPath = node_path_1.default.join(testsDir, relativePath);
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(targetPath), { recursive: true });
        node_fs_1.default.writeFileSync(targetPath, contents, 'utf-8');
    }
    for (const [relativePath, contents] of Object.entries(suites)) {
        const targetPath = node_path_1.default.join(suitesDir, relativePath);
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(targetPath), { recursive: true });
        node_fs_1.default.writeFileSync(targetPath, contents, 'utf-8');
    }
    return rootDir;
}
function buildWorkspaceConfigYaml(configYaml) {
    if (configYaml === null) {
        return undefined;
    }
    const defaultAppConfig = ['app:', '  packageName: org.wikipedia'].join('\n');
    if (configYaml === undefined) {
        return `${defaultAppConfig}\n`;
    }
    if (/^app:/m.test(configYaml)) {
        return configYaml;
    }
    const trimmedConfig = configYaml.trimEnd();
    return `${trimmedConfig}\n${defaultAppConfig}\n`;
}
async function withTempHome(callback) {
    const homeDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-workspace-home-'));
    const previousHome = process.env.HOME;
    process.env.HOME = homeDir;
    try {
        return await callback(homeDir);
    }
    finally {
        if (previousHome === undefined) {
            delete process.env.HOME;
        }
        else {
            process.env.HOME = previousHome;
        }
        await promises_1.default.rm(homeDir, { recursive: true, force: true });
    }
}
(0, node_test_1.default)('runCheck resolves the nearest .usb-ui-test workspace and runtime bindings from a nested cwd', async () => {
    const secretEnvVar = 'USB_UI_TEST_WORKSPACE_EMAIL_SECRET';
    const previousSecret = process.env[secretEnvVar];
    process.env[secretEnvVar] = 'person@example.com';
    const rootDir = createTempWorkspace({
        envYaml: [
            'secrets:',
            `  email: \${${secretEnvVar}}`,
            'variables:',
            '  language: Spanish',
        ].join('\n'),
        testFiles: {
            'auth/login.yaml': [
                'name: login',
                'steps:',
                '  - Enter ${secrets.email} on the login screen.',
                '  - Verify ${variables.language} is visible after login.',
            ].join('\n'),
        },
    });
    try {
        const nestedCwd = node_path_1.default.join(rootDir, 'packages', 'app');
        node_fs_1.default.mkdirSync(nestedCwd, { recursive: true });
        const result = await (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: nestedCwd,
        });
        strict_1.default.equal(result.workspace.rootDir, rootDir);
        strict_1.default.equal(result.tests.length, 1);
        strict_1.default.equal(result.tests[0]?.relativePath, 'auth/login.yaml');
        strict_1.default.equal(result.environment.bindings.variables.language, 'Spanish');
        strict_1.default.equal(result.environment.bindings.secrets.email, 'person@example.com');
        strict_1.default.equal(result.environment.secretReferences[0]?.envVar, secretEnvVar);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
        if (previousSecret === undefined) {
            delete process.env[secretEnvVar];
        }
        else {
            process.env[secretEnvVar] = previousSecret;
        }
    }
});
(0, node_test_1.default)('runCheck defaults to dev when envName is omitted and dev.yaml exists', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'dev.yaml': ['variables:', '  language: Spanish'].join('\n'),
            'staging.yaml': ['variables:', '  language: German'].join('\n'),
        },
        testFiles: {
            'language.yaml': [
                'name: language',
                'steps:',
                '  - Verify ${variables.language} is visible.',
            ].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'dev');
        strict_1.default.equal(result.environment.bindings.variables.language, 'Spanish');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck uses .usb-ui-test/config.yaml env when --env is omitted', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: staging\n',
        envFiles: {
            'dev.yaml': ['variables:', '  language: Spanish'].join('\n'),
            'staging.yaml': ['variables:', '  language: German'].join('\n'),
        },
        testFiles: {
            'language.yaml': [
                'name: language',
                'steps:',
                '  - Verify ${variables.language} is visible.',
            ].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'staging');
        strict_1.default.equal(result.environment.bindings.variables.language, 'German');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck prefers explicit envName over .usb-ui-test/config.yaml env', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: staging\n',
        envFiles: {
            'dev.yaml': ['variables:', '  language: Spanish'].join('\n'),
            'staging.yaml': ['variables:', '  language: German'].join('\n'),
        },
        testFiles: {
            'language.yaml': [
                'name: language',
                'steps:',
                '  - Verify ${variables.language} is visible.',
            ].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir, envName: 'dev' });
        strict_1.default.equal(result.environment.envName, 'dev');
        strict_1.default.equal(result.environment.bindings.variables.language, 'Spanish');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck succeeds with empty bindings when envName is omitted and .usb-ui-test/env is absent', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
        testFiles: {
            'smoke.yaml': ['name: smoke', 'steps:', '  - Open the app.'].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'none');
        strict_1.default.deepEqual(result.environment.bindings, { secrets: {}, variables: {} });
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck succeeds with empty bindings when envName is omitted and .usb-ui-test/env exists but has no env files', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {},
        testFiles: {
            'smoke.yaml': ['name: smoke', 'steps:', '  - Open the app.'].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'none');
        strict_1.default.deepEqual(result.environment.bindings, { secrets: {}, variables: {} });
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck falls back to the sole env file when envName is omitted and dev.yaml is absent', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'qa.yaml': ['variables:', '  locale: en-GB'].join('\n'),
        },
        testFiles: {
            'locale.yaml': [
                'name: locale',
                'steps:',
                '  - Verify ${variables.locale} is selected.',
            ].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'qa');
        strict_1.default.equal(result.environment.bindings.variables.locale, 'en-GB');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck fails with an actionable ambiguity error when envName is omitted and multiple non-dev env files exist', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'staging.yaml': '{}\n',
            'prod.yaml': '{}\n',
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /Pass --env <name>\. Available environments: prod, staging/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck fails with actionable guidance when a test references env bindings but .usb-ui-test/env is absent', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
        testFiles: {
            'language.yaml': [
                'name: language',
                'steps:',
                '  - Verify ${variables.language} is visible.',
            ].join('\n'),
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /no environment configuration was resolved.*\$\{variables\.language\}/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck fails with actionable guidance when --env is explicit but .usb-ui-test/env is absent', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ envName: 'dev', cwd: rootDir }), /Environment "dev" was requested, but .*\/\.usb-ui-test\/env does not exist/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck preserves the missing-env error when .usb-ui-test/config.yaml points to a missing env file', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: staging\n',
        envFiles: {
            'dev.yaml': '{}\n',
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /Environment "staging" was not found .* Available environments: dev/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck requires app config in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: null,
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /\.usb-ui-test\/config\.yaml must define app\.packageName and\/or app\.bundleId/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck accepts env app overrides and resolves the env-specific identifier', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['env: staging', 'app:', '  packageName: org.wikipedia'].join('\n'),
        envFiles: {
            'staging.yaml': ['app:', '  packageName: org.wikipedia.beta'].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'staging');
        strict_1.default.equal(result.resolvedApp.platform, 'android');
        strict_1.default.equal(result.resolvedApp.identifier, 'org.wikipedia.beta');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck fails when both Android and iOS apps are configured without an explicit platform', async () => {
    const rootDir = createTempWorkspace({
        configYaml: [
            'app:',
            '  packageName: org.wikipedia',
            '  bundleId: org.wikipedia',
        ].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /Both Android and iOS app identifiers are configured\. Pass --platform android or --platform ios\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck fails when the requested platform is missing from the app config', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['app:', '  packageName: org.wikipedia'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir, platform: 'ios' }), /No app config found for platform "ios"/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck fails when an iOS app override bundle ID does not match config', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
        configYaml: ['app:', '  bundleId: org.wikipedia'].join('\n'),
    });
    const appBundlePath = node_path_1.default.join(rootDir, 'Wikipedia.app');
    node_fs_1.default.mkdirSync(appBundlePath, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(appBundlePath, 'Info.plist'), [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
        '<plist version="1.0">',
        '<dict>',
        '  <key>CFBundleIdentifier</key>',
        '  <string>org.wikipedia.beta</string>',
        '</dict>',
        '</plist>',
    ].join('\n'), 'utf-8');
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir, appPath: appBundlePath }), /Configured iOS bundle ID is "org\.wikipedia", but the override app resolved to "org\.wikipedia\.beta"/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects nested app config and points to the flat schema', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['app:', '  android:', '    packageName: org.wikipedia'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /\.usb-ui-test\/config\.yaml app uses an unsupported nested format\. Use app\.name, app\.packageName, and app\.bundleId\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects empty app identifiers in workspace config', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['app:', '  packageName: ""'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /\.usb-ui-test\/config\.yaml app packageName must not be empty\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck treats env app config as a full replacement', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['env: staging', 'app:', '  packageName: org.wikipedia', '  bundleId: org.wikipedia.ios'].join('\n'),
        envFiles: {
            'staging.yaml': ['app:', '  packageName: org.wikipedia.beta'].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'staging');
        strict_1.default.equal(result.resolvedApp.platform, 'android');
        strict_1.default.equal(result.resolvedApp.identifier, 'org.wikipedia.beta');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects tests with preconditions keys', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'login.yaml': [
                'name: login',
                'preconditions:',
                '  - App is installed.',
                'steps:',
                '  - Open the login screen.',
            ].join('\n'),
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ envName: 'dev', cwd: rootDir }), /contains unsupported key "preconditions"/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck ignores invalid model formats in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: "not-a-provider-model"\n',
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'dev');
        strict_1.default.equal(result.tests.length, 1);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck ignores unsupported model providers in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: "bedrock/claude"\n',
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ cwd: rootDir });
        strict_1.default.equal(result.environment.envName, 'dev');
        strict_1.default.equal(result.tests.length, 1);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects invalid YAML in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: [dev\n',
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /Invalid YAML in .*\/\.usb-ui-test\/config\.yaml:/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects unknown keys in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['env: dev', 'region: us-west-2'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /config\.yaml contains unsupported key "region"\. Supported keys: env, model, reasoning, features, app\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects non-string env values in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: 123\n',
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /config\.yaml env must be a string\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects non-string model values in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: 123\n',
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /config\.yaml model must be a string\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects empty env values in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: "   "\n',
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /config\.yaml env must not be empty\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects invalid reasoning level in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'reasoning: extreme\n',
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /config\.yaml reasoning has invalid value "extreme"\. Allowed values: minimal, low, medium, high\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects unknown feature names in .usb-ui-test/config.yaml', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['features:', '  plannerX:', '    reasoning: high'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /features contains unsupported key "plannerX"\. Supported keys: planner, grounder, visual-grounder, scroll-index-grounder, input-focus-grounder, launch-app-grounder, set-location-grounder\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects unknown inner keys in a features override', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['features:', '  planner:', '    temperature: 0.2'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /features\.planner contains unsupported key "temperature"\. Supported keys: model, reasoning\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects invalid reasoning in a features override', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['features:', '  planner:', '    reasoning: extreme'].join('\n'),
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }), /features\.planner\.reasoning has invalid value "extreme"\./);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck accepts a valid features block and preserves unset features', async () => {
    const rootDir = createTempWorkspace({
        configYaml: [
            'model: openai/gpt-5.4-mini',
            'reasoning: medium',
            'features:',
            '  planner:',
            '    model: anthropic/claude-opus-4-7',
            '    reasoning: high',
            '  scroll-index-grounder:',
            '    reasoning: low',
        ].join('\n'),
    });
    try {
        await strict_1.default.doesNotReject(() => (0, checkRunner_js_1.runCheck)({ cwd: rootDir }));
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck accepts empty-string secret environment values when the variable is present', async () => {
    const secretEnvVar = 'USB_UI_TEST_EMPTY_SECRET';
    const previousSecret = process.env[secretEnvVar];
    process.env[secretEnvVar] = '';
    const rootDir = createTempWorkspace({
        envYaml: ['secrets:', `  otp: \${${secretEnvVar}}`].join('\n'),
        testFiles: {
            'otp.yaml': ['name: otp', 'steps:', '  - Enter ${secrets.otp}.'].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ envName: 'dev', cwd: rootDir });
        strict_1.default.equal(result.environment.bindings.secrets.otp, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
        if (previousSecret === undefined) {
            delete process.env[secretEnvVar];
        }
        else {
            process.env[secretEnvVar] = previousSecret;
        }
    }
});
(0, node_test_1.default)('runCheck resolves secrets from workspace-root .env.<env> without process.env', async () => {
    const secretEnvVar = 'USB_UI_TEST_DOTENV_SECRET_BINDING_TEST';
    const previousSecret = process.env[secretEnvVar];
    delete process.env[secretEnvVar];
    const rootDir = createTempWorkspace({
        envYaml: ['secrets:', `  token: \${${secretEnvVar}}`].join('\n'),
        testFiles: {
            'auth.yaml': [
                'name: auth',
                'steps:',
                '  - Send ${secrets.token} to the API.',
            ].join('\n'),
        },
    });
    node_fs_1.default.writeFileSync(node_path_1.default.join(rootDir, '.env.dev'), `${secretEnvVar}=only-in-dotenv\n`, 'utf-8');
    try {
        const result = await (0, checkRunner_js_1.runCheck)({ envName: 'dev', cwd: rootDir });
        strict_1.default.equal(result.environment.bindings.secrets.token, 'only-in-dotenv');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
        if (previousSecret === undefined) {
            delete process.env[secretEnvVar];
        }
        else {
            process.env[secretEnvVar] = previousSecret;
        }
    }
});
(0, node_test_1.default)('runCheck loads workspace-root .env.<env> when cwd is nested under the workspace', async () => {
    const secretEnvVar = 'USB_UI_TEST_DOTENV_NESTED_CWD_TEST';
    const previousSecret = process.env[secretEnvVar];
    delete process.env[secretEnvVar];
    const rootDir = createTempWorkspace({
        envYaml: ['secrets:', `  token: \${${secretEnvVar}}`].join('\n'),
        testFiles: {
            'auth.yaml': ['name: auth', 'steps:', '  - Open login.'].join('\n'),
        },
    });
    node_fs_1.default.writeFileSync(node_path_1.default.join(rootDir, '.env.dev'), `${secretEnvVar}=from-workspace-dotenv\n`, 'utf-8');
    try {
        const nestedCwd = node_path_1.default.join(rootDir, 'packages', 'app');
        node_fs_1.default.mkdirSync(nestedCwd, { recursive: true });
        const result = await (0, checkRunner_js_1.runCheck)({ envName: 'dev', cwd: nestedCwd });
        strict_1.default.equal(result.workspace.rootDir, rootDir);
        strict_1.default.equal(result.environment.bindings.secrets.token, 'from-workspace-dotenv');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
        if (previousSecret === undefined) {
            delete process.env[secretEnvVar];
        }
        else {
            process.env[secretEnvVar] = previousSecret;
        }
    }
});
(0, node_test_1.default)('runCheck rejects selectors that escape .usb-ui-test/tests', async () => {
    const rootDir = createTempWorkspace();
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['../outside.yaml'],
        }), /Test selector must stay inside/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck expands multiple selectors with comma splitting and de-duplicates first-seen matches', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'smoke.yaml': ['name: smoke', 'steps:', '  - Open the app.'].join('\n'),
            'auth/login.yaml': ['name: login', 'steps:', '  - Open login.'].join('\n'),
            'auth/settings.yaml': ['name: settings', 'steps:', '  - Open settings.'].join('\n'),
            'auth/profile/edit.yaml': ['name: edit', 'steps:', '  - Edit profile.'].join('\n'),
            'auth/profile/view.yaml': ['name: view', 'steps:', '  - View profile.'].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['smoke.yaml,auth/login.yaml', 'auth/profile', 'auth/**'],
        });
        strict_1.default.deepEqual(result.tests.map((t) => t.relativePath), [
            'smoke.yaml',
            'auth/login.yaml',
            'auth/profile/edit.yaml',
            'auth/profile/view.yaml',
            'auth/settings.yaml',
        ]);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck treats raw directory selectors as recursive and * as shallow while ** is recursive', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'auth/login.yaml': ['name: login', 'steps:', '  - Open login.'].join('\n'),
            'auth/profile/edit.yaml': ['name: edit', 'steps:', '  - Edit profile.'].join('\n'),
            'auth/profile/view.yaml': ['name: view', 'steps:', '  - View profile.'].join('\n'),
            'auth/settings.yaml': ['name: settings', 'steps:', '  - Open settings.'].join('\n'),
        },
    });
    try {
        const recursiveDirectory = await (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['auth'],
        });
        const shallowGlob = await (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['auth/*'],
        });
        const recursiveGlob = await (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['auth/**'],
        });
        strict_1.default.deepEqual(recursiveDirectory.tests.map((t) => t.relativePath), [
            'auth/login.yaml',
            'auth/profile/edit.yaml',
            'auth/profile/view.yaml',
            'auth/settings.yaml',
        ]);
        strict_1.default.deepEqual(shallowGlob.tests.map((t) => t.relativePath), ['auth/login.yaml', 'auth/settings.yaml']);
        strict_1.default.deepEqual(recursiveGlob.tests.map((t) => t.relativePath), [
            'auth/login.yaml',
            'auth/profile/edit.yaml',
            'auth/profile/view.yaml',
            'auth/settings.yaml',
        ]);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck resolves suite manifests into an ordered shared test list', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'smoke.yaml': ['name: smoke', 'steps:', '  - Open the app.'].join('\n'),
            'auth/login.yaml': ['name: login', 'steps:', '  - Open login.'].join('\n'),
            'auth/settings.yaml': ['name: settings', 'steps:', '  - Open settings.'].join('\n'),
        },
        suites: {
            'login_suite.yaml': [
                'name: login suite',
                'description: Covers login entry points.',
                'tests:',
                '  - smoke.yaml',
                '  - auth/**',
            ].join('\n'),
        },
    });
    try {
        const result = await (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            suitePath: 'login_suite.yaml',
        });
        strict_1.default.deepEqual(result.target, {
            type: 'suite',
            suiteId: 'login_suite',
            suiteName: 'login suite',
            suitePath: 'login_suite.yaml',
        });
        strict_1.default.equal(result.suite?.name, 'login suite');
        strict_1.default.equal(result.suite?.description, 'Covers login entry points.');
        strict_1.default.deepEqual(result.tests.map((t) => t.relativePath), ['smoke.yaml', 'auth/login.yaml', 'auth/settings.yaml']);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects mixing --suite with positional selectors', async () => {
    const rootDir = createTempWorkspace({
        suites: {
            'login_suite.yaml': ['name: login suite', 'tests:', '  - login.yaml'].join('\n'),
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            suitePath: 'login_suite.yaml',
            selectors: ['login.yaml'],
        }), new RegExp(checkRunner_js_1.SUITE_SELECTOR_CONFLICT_ERROR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects suite manifests with empty tests arrays', async () => {
    const rootDir = createTempWorkspace({
        suites: {
            'empty_suite.yaml': ['name: empty suite', 'tests: []'].join('\n'),
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            suitePath: 'empty_suite.yaml',
        }), /must define a non-empty tests array/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects suite manifests with non-string descriptions', async () => {
    const rootDir = createTempWorkspace({
        suites: {
            'invalid_suite.yaml': [
                'name: invalid suite',
                'description: 42',
                'tests:',
                '  - login.yaml',
            ].join('\n'),
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            suitePath: 'invalid_suite.yaml',
        }), /description must be a string when provided/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck requires at least one selector when requireSelection is enabled', async () => {
    const rootDir = createTempWorkspace();
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({
            envName: 'dev',
            cwd: rootDir,
            requireSelection: true,
        }), /At least one test selector is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runCheck rejects tests with empty steps arrays', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'broken.yaml': ['name: broken', 'steps: []'].join('\n'),
        },
    });
    try {
        await strict_1.default.rejects(() => (0, checkRunner_js_1.runCheck)({ envName: 'dev', cwd: rootDir }), /must define a non-empty steps array/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('validateAppOverride accepts .apk and .app bundles and rejects unsupported paths', async () => {
    const tempDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-app-override-'));
    const apkPath = node_path_1.default.join(tempDir, 'app.apk');
    const apkDirPath = node_path_1.default.join(tempDir, 'fake.apk');
    const iosAppPath = node_path_1.default.join(tempDir, 'My.app');
    const zipPath = node_path_1.default.join(tempDir, 'archive.zip');
    node_fs_1.default.writeFileSync(apkPath, 'apk', 'utf-8');
    node_fs_1.default.mkdirSync(apkDirPath, { recursive: true });
    node_fs_1.default.mkdirSync(iosAppPath, { recursive: true });
    node_fs_1.default.writeFileSync(zipPath, 'zip', 'utf-8');
    try {
        const androidOverride = await (0, workspace_js_1.validateAppOverride)(apkPath, 'android');
        const iosOverride = await (0, workspace_js_1.validateAppOverride)(iosAppPath, 'ios');
        strict_1.default.equal(androidOverride.inferredPlatform, 'android');
        strict_1.default.equal(iosOverride.inferredPlatform, 'ios');
        await strict_1.default.rejects(() => (0, workspace_js_1.validateAppOverride)(zipPath), /Unsupported --app override/);
        await strict_1.default.rejects(() => (0, workspace_js_1.validateAppOverride)(apkDirPath, 'android'), /must point to an APK file/);
    }
    finally {
        await promises_1.default.rm(tempDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('ensureWorkspaceDirectories creates a hashed external artifacts directory and metadata', async () => {
    await withTempHome(async (homeDir) => {
        const rootDir = createTempWorkspace();
        try {
            const nestedCwd = node_path_1.default.join(rootDir, 'apps', 'mobile');
            node_fs_1.default.mkdirSync(nestedCwd, { recursive: true });
            const workspace = await (0, workspace_js_1.resolveWorkspace)(nestedCwd);
            const rootWorkspace = await (0, workspace_js_1.resolveWorkspace)(rootDir);
            await (0, workspace_js_1.ensureWorkspaceDirectories)(workspace);
            strict_1.default.equal(workspace.artifactsDir, rootWorkspace.artifactsDir);
            strict_1.default.equal(workspace.artifactsDir.startsWith(node_path_1.default.join(homeDir, '.usb-ui-test', 'workspaces') + node_path_1.default.sep), true);
            const artifactsStat = await promises_1.default.stat(workspace.artifactsDir);
            strict_1.default.equal(artifactsStat.isDirectory(), true);
            const metadataPath = node_path_1.default.join(workspace.artifactsDir, '..', 'workspace.json');
            const metadata = JSON.parse(await promises_1.default.readFile(metadataPath, 'utf-8'));
            const canonicalRootDir = await promises_1.default.realpath(rootDir);
            strict_1.default.equal(metadata.workspaceRoot, rootDir);
            strict_1.default.equal(metadata.canonicalWorkspaceRoot, canonicalRootDir);
            strict_1.default.equal(metadata.artifactsDir, workspace.artifactsDir);
            strict_1.default.equal(metadata.workspaceHash.length, 16);
        }
        finally {
            await promises_1.default.rm(rootDir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.default)('resolveWorkspace refreshes lastUsedAt for direct callers', async () => {
    await withTempHome(async () => {
        const rootDir = createTempWorkspace();
        const existingLastUsedAt = '2020-01-01T00:00:00.000Z';
        try {
            const artifactsDir = await (0, workspace_js_1.resolveWorkspaceArtifactsDir)(rootDir);
            const metadataPath = node_path_1.default.join(artifactsDir, '..', 'workspace.json');
            await promises_1.default.mkdir(node_path_1.default.dirname(metadataPath), { recursive: true });
            await promises_1.default.writeFile(metadataPath, JSON.stringify({
                schemaVersion: 1,
                workspaceRoot: rootDir,
                canonicalWorkspaceRoot: await promises_1.default.realpath(rootDir),
                workspaceHash: 'seeded-workspace-hash',
                artifactsDir,
                lastUsedAt: existingLastUsedAt,
            }, null, 2), 'utf-8');
            const workspace = await (0, workspace_js_1.resolveWorkspace)(rootDir);
            const metadata = JSON.parse(await promises_1.default.readFile(metadataPath, 'utf-8'));
            strict_1.default.equal(workspace.rootDir, rootDir);
            strict_1.default.ok(Date.parse(metadata.lastUsedAt ?? '') > Date.parse(existingLastUsedAt));
        }
        finally {
            await promises_1.default.rm(rootDir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.default)('resolveWorkspaceForCommand resolves an explicit workspace path, persists a derived display name, and refreshes lastUsedAt', async () => {
    await withTempHome(async () => {
        const rootDir = createTempWorkspace();
        const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-outside-workspace-'));
        const existingLastUsedAt = '2020-01-01T00:00:00.000Z';
        node_fs_1.default.writeFileSync(node_path_1.default.join(rootDir, 'package.json'), JSON.stringify({ name: 'sample/mobile-app' }, null, 2), 'utf-8');
        const nestedWorkspacePath = node_path_1.default.join(rootDir, 'packages', 'mobile');
        node_fs_1.default.mkdirSync(nestedWorkspacePath, { recursive: true });
        try {
            const seededWorkspace = await (0, workspace_js_1.resolveWorkspace)(rootDir);
            const metadataPath = node_path_1.default.join(seededWorkspace.artifactsDir, '..', 'workspace.json');
            await promises_1.default.mkdir(node_path_1.default.dirname(metadataPath), { recursive: true });
            await promises_1.default.writeFile(metadataPath, JSON.stringify({
                schemaVersion: 1,
                workspaceRoot: rootDir,
                canonicalWorkspaceRoot: await promises_1.default.realpath(rootDir),
                workspaceHash: 'seeded-workspace-hash',
                artifactsDir: seededWorkspace.artifactsDir,
                lastUsedAt: existingLastUsedAt,
            }, null, 2), 'utf-8');
            const workspace = await (0, workspace_js_1.resolveWorkspaceForCommand)({
                cwd: outsideDir,
                workspacePath: nestedWorkspacePath,
                io: {
                    input: new node_stream_1.PassThrough(),
                    output: new node_stream_1.PassThrough(),
                    isTTY: false,
                },
            });
            strict_1.default.equal(workspace.rootDir, rootDir);
            const metadata = JSON.parse(await promises_1.default.readFile(metadataPath, 'utf-8'));
            strict_1.default.equal(metadata.displayName, 'sample/mobile-app');
            strict_1.default.match(metadata.lastUsedAt ?? '', /^\d{4}-\d{2}-\d{2}T/);
            strict_1.default.ok(Date.parse(metadata.lastUsedAt ?? '') > Date.parse(existingLastUsedAt));
        }
        finally {
            await promises_1.default.rm(rootDir, { recursive: true, force: true });
            await promises_1.default.rm(outsideDir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.default)('resolveWorkspaceForCommand shows the TTY picker, ignores stale and malformed registry entries, and persists runtime-derived labels', async () => {
    await withTempHome(async () => {
        const alphaRoot = createTempWorkspace();
        const bravoRoot = createTempWorkspace();
        const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-picker-outside-'));
        const input = new node_stream_1.PassThrough();
        const output = new node_stream_1.PassThrough();
        let outputText = '';
        output.on('data', (chunk) => {
            outputText += String(chunk);
        });
        node_fs_1.default.writeFileSync(node_path_1.default.join(alphaRoot, 'package.json'), JSON.stringify({ name: 'alpha/mobile-app' }, null, 2), 'utf-8');
        node_fs_1.default.writeFileSync(node_path_1.default.join(bravoRoot, 'package.json'), JSON.stringify({ name: 'bravo/mobile-app' }, null, 2), 'utf-8');
        try {
            await (0, workspace_js_1.ensureWorkspaceDirectories)(await (0, workspace_js_1.resolveWorkspaceFromPath)(alphaRoot));
            await (0, workspace_js_1.ensureWorkspaceDirectories)(await (0, workspace_js_1.resolveWorkspaceFromPath)(bravoRoot));
            const staleMetadataDir = node_path_1.default.join((0, workspace_js_1.resolveWorkspaceArtifactsRootDir)(), 'stale-workspace');
            await promises_1.default.mkdir(staleMetadataDir, { recursive: true });
            await promises_1.default.writeFile(node_path_1.default.join(staleMetadataDir, 'workspace.json'), JSON.stringify({
                schemaVersion: 1,
                workspaceRoot: node_path_1.default.join(outsideDir, 'missing-workspace'),
                canonicalWorkspaceRoot: node_path_1.default.join(outsideDir, 'missing-workspace'),
                workspaceHash: 'stale-workspace',
                artifactsDir: node_path_1.default.join(staleMetadataDir, 'artifacts'),
            }), 'utf-8');
            const malformedMetadataDir = node_path_1.default.join((0, workspace_js_1.resolveWorkspaceArtifactsRootDir)(), 'malformed-workspace');
            await promises_1.default.mkdir(malformedMetadataDir, { recursive: true });
            await promises_1.default.writeFile(node_path_1.default.join(malformedMetadataDir, 'workspace.json'), JSON.stringify({
                schemaVersion: 1,
                workspaceRoot: 42,
                canonicalWorkspaceRoot: bravoRoot,
                workspaceHash: 'malformed-workspace',
                artifactsDir: node_path_1.default.join(malformedMetadataDir, 'artifacts'),
            }), 'utf-8');
            input.write('0\n');
            setTimeout(() => {
                input.write('2\n');
                input.end();
            }, 25);
            const selectedWorkspace = await (0, workspace_js_1.resolveWorkspaceForCommand)({
                cwd: outsideDir,
                io: {
                    input,
                    output,
                    isTTY: true,
                },
            });
            strict_1.default.equal(selectedWorkspace.rootDir, bravoRoot);
            strict_1.default.match(outputText, /Select a UsbUiTest workspace/);
            strict_1.default.match(outputText, /1\. alpha\/mobile-app/);
            strict_1.default.match(outputText, new RegExp(alphaRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
            strict_1.default.match(outputText, /2\. bravo\/mobile-app/);
            strict_1.default.match(outputText, /Invalid selection/);
            strict_1.default.doesNotMatch(outputText, /stale-workspace/);
            const alphaMetadata = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(await (0, workspace_js_1.resolveWorkspaceArtifactsDir)(alphaRoot), '..', 'workspace.json'), 'utf-8'));
            const bravoMetadata = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(await (0, workspace_js_1.resolveWorkspaceArtifactsDir)(bravoRoot), '..', 'workspace.json'), 'utf-8'));
            strict_1.default.equal(alphaMetadata.displayName, 'alpha/mobile-app');
            strict_1.default.equal(bravoMetadata.displayName, 'bravo/mobile-app');
        }
        finally {
            await promises_1.default.rm(alphaRoot, { recursive: true, force: true });
            await promises_1.default.rm(bravoRoot, { recursive: true, force: true });
            await promises_1.default.rm(outsideDir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.default)('resolveWorkspaceForCommand fails with guidance outside a workspace when no TTY or explicit workspace is available', async () => {
    await withTempHome(async () => {
        const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-missing-workspace-'));
        try {
            await strict_1.default.rejects(() => (0, workspace_js_1.resolveWorkspaceForCommand)({
                cwd: outsideDir,
                io: {
                    input: new node_stream_1.PassThrough(),
                    output: new node_stream_1.PassThrough(),
                    isTTY: false,
                },
            }), /Pass --workspace <path> to target a UsbUiTest workspace explicitly/);
        }
        finally {
            await promises_1.default.rm(outsideDir, { recursive: true, force: true });
        }
    });
});
(0, node_test_1.default)('resolveWorkspaceFromPath reports a clear error for invalid explicit workspace paths', async () => {
    await withTempHome(async () => {
        const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-invalid-workspace-'));
        try {
            await strict_1.default.rejects(() => (0, workspace_js_1.resolveWorkspaceForCommand)({
                cwd: outsideDir,
                workspacePath: node_path_1.default.join(outsideDir, 'missing'),
                io: {
                    input: new node_stream_1.PassThrough(),
                    output: new node_stream_1.PassThrough(),
                    isTTY: false,
                },
            }), /Path is not inside a UsbUiTest workspace/);
        }
        finally {
            await promises_1.default.rm(outsideDir, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=workspace.test.js.map