"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_child_process_1 = require("node:child_process");
const node_fs_1 = __importDefault(require("node:fs"));
const promises_1 = __importDefault(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const doctorRunner_js_1 = require("./doctorRunner.js");
const workspace_js_1 = require("./workspace.js");
const CLI_TEST_HOME = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-home-'));
function createTempWorkspace(params) {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-bin-'));
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    const suitesDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'suites');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    if (params?.includeEnvDir !== false) {
        node_fs_1.default.mkdirSync(envDir, { recursive: true });
    }
    const suites = params?.suites ?? {};
    if ((params?.includeSuitesDir ?? Object.keys(suites).length > 0) === true) {
        node_fs_1.default.mkdirSync(suitesDir, { recursive: true });
    }
    const configYaml = buildWorkspaceConfigYaml(params?.configYaml);
    if (configYaml !== undefined) {
        node_fs_1.default.writeFileSync(node_path_1.default.join(rootDir, '.usb-ui-test', 'config.yaml'), configYaml, 'utf-8');
    }
    const testFiles = params?.testFiles ?? {
        'login.yaml': (params?.testLines ?? ['name: login', 'steps:', '  - Open the login screen.']).join('\n'),
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
    if (params?.includeEnvDir !== false) {
        for (const [fileName, contents] of Object.entries(params?.envFiles ?? { 'dev.yaml': '{}\n' })) {
            node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, fileName), contents, 'utf-8');
        }
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
function runCli(args, cwd, envOverrides) {
    const compiledBinPath = node_path_1.default.resolve(__dirname, '../bin/usb-ui-test.js');
    const sourceBinPath = node_path_1.default.resolve(__dirname, '../bin/usb-ui-test.ts');
    const tsxCliPath = node_path_1.default.resolve(__dirname, '../../../node_modules/tsx/dist/cli.mjs');
    const tsconfigPath = node_path_1.default.resolve(__dirname, '../../../tsconfig.dev.json');
    const commandArgs = node_fs_1.default.existsSync(compiledBinPath)
        ? [compiledBinPath, ...args]
        : node_fs_1.default.existsSync(tsconfigPath)
            ? [tsxCliPath, '--tsconfig', tsconfigPath, sourceBinPath, ...args]
            : [tsxCliPath, sourceBinPath, ...args];
    return (0, node_child_process_1.spawnSync)(process.execPath, commandArgs, {
        cwd,
        env: {
            ...process.env,
            HOME: CLI_TEST_HOME,
            ...envOverrides,
        },
        encoding: 'utf-8',
    });
}
async function resolveWorkspaceForHome(cwd, homeDir) {
    const previousHome = process.env.HOME;
    process.env.HOME = homeDir;
    try {
        return await (0, workspace_js_1.resolveWorkspace)(cwd);
    }
    finally {
        if (previousHome === undefined) {
            delete process.env.HOME;
        }
        else {
            process.env.HOME = previousHome;
        }
    }
}
const EMPTY_PROVIDER_ENV_VARS = {
    OPENAI_API_KEY: '',
    GOOGLE_API_KEY: '',
    ANTHROPIC_API_KEY: '',
};
async function assertNoRunArtifacts(cwd) {
    const workspace = await resolveWorkspaceForHome(cwd, CLI_TEST_HOME);
    const artifactEntries = await promises_1.default.readdir(workspace.artifactsDir).catch(() => []);
    const runEntries = artifactEntries.filter((e) => e !== '.server.json');
    strict_1.default.deepEqual(runEntries, []);
    await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(workspace.artifactsDir, 'runs.json')));
}
function assertNoRunOutput(result) {
    strict_1.default.doesNotMatch(result.stdout, /All tests passed/);
    strict_1.default.doesNotMatch(result.stdout, /test\(s\) failed/);
    strict_1.default.doesNotMatch(result.stdout, /Run directory:/);
    strict_1.default.doesNotMatch(result.stdout, /Run report available at/);
}
function createDoctorDependencies(params) {
    return {
        hostPreflightDependencies: {
            getPlatform: () => params.hostPlatform ?? 'darwin',
        },
        async runHostPreflight(options) {
            return {
                requestedPlatforms: params.requestedPlatforms ?? options.requestedPlatforms,
                checks: params.reportChecks,
            };
        },
    };
}
async function findAvailablePort() {
    const net = await import('node:net');
    return await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                server.close(() => reject(new Error('No ephemeral port allocated.')));
                return;
            }
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(address.port);
            });
        });
    });
}
(0, node_test_1.default)('usb-ui-test check works without --env when dev.yaml exists', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'dev.yaml': ['variables:', '  locale: en-US'].join('\n'),
        },
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /Using Android package: org\.wikipedia/);
        strict_1.default.match(result.stdout, /using env dev\./);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check uses .usb-ui-test/config.yaml env when --env is omitted', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: staging\n',
        envFiles: {
            'dev.yaml': ['variables:', '  locale: en-US'].join('\n'),
            'staging.yaml': ['variables:', '  locale: de-DE'].join('\n'),
        },
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /using env staging\./);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check prefers --env over .usb-ui-test/config.yaml env', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'env: staging\n',
        envFiles: {
            'dev.yaml': ['variables:', '  locale: en-US'].join('\n'),
            'staging.yaml': ['variables:', '  locale: de-DE'].join('\n'),
        },
    });
    try {
        const result = runCli(['check', '--env', 'dev'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /using env dev\./);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check ignores config model values', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: bedrock/claude\n',
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /using env dev\./);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runDoctorCommand reports missing Android blockers', async () => {
    const output = new node_stream_1.PassThrough();
    let printed = '';
    output.on('data', (chunk) => {
        printed += chunk.toString();
    });
    const result = await (0, doctorRunner_js_1.runDoctorCommand)({
        platform: 'android',
        output,
    }, createDoctorDependencies({
        reportChecks: [
            {
                platform: common_1.PLATFORM_ANDROID,
                status: 'error',
                id: 'adb',
                title: 'adb',
                summary: 'Required to communicate with Android devices.',
                detail: 'ADB was not found in ANDROID_HOME, ANDROID_SDK_ROOT, or PATH.',
                blocking: true,
            },
        ],
    }));
    strict_1.default.equal(result.success, false);
    strict_1.default.match(printed, /Setup Required/);
    strict_1.default.match(printed, /adb/);
});
(0, node_test_1.default)('runDoctorCommand reports missing iOS blockers', async () => {
    const output = new node_stream_1.PassThrough();
    let printed = '';
    output.on('data', (chunk) => {
        printed += chunk.toString();
    });
    const result = await (0, doctorRunner_js_1.runDoctorCommand)({
        platform: 'ios',
        output,
    }, createDoctorDependencies({
        reportChecks: [
            {
                platform: common_1.PLATFORM_IOS,
                status: 'error',
                id: 'xcrun',
                title: 'xcrun',
                summary: 'Required to access iOS simulator tooling.',
                detail: 'xcrun was not found in PATH.',
                blocking: true,
            },
        ],
    }));
    strict_1.default.equal(result.success, false);
    strict_1.default.match(printed, /Setup Required/);
    strict_1.default.match(printed, /xcrun/);
});
(0, node_test_1.default)('runDoctorCommand defaults to both platforms on mac and prints warnings separately', async () => {
    const output = new node_stream_1.PassThrough();
    let printed = '';
    output.on('data', (chunk) => {
        printed += chunk.toString();
    });
    const observedPlatforms = [];
    const result = await (0, doctorRunner_js_1.runDoctorCommand)({
        output,
    }, {
        hostPreflightDependencies: {
            getPlatform: () => 'darwin',
        },
        async runHostPreflight(options) {
            observedPlatforms.push(...options.requestedPlatforms);
            return {
                requestedPlatforms: options.requestedPlatforms,
                checks: [
                    {
                        platform: common_1.PLATFORM_ANDROID,
                        status: 'ok',
                        id: 'adb',
                        title: 'adb',
                        summary: 'Required to communicate with Android devices.',
                        detail: '/mock/adb',
                        blocking: true,
                    },
                    {
                        platform: common_1.PLATFORM_IOS,
                        status: 'warning',
                        id: 'ffmpeg',
                        title: 'ffmpeg',
                        summary: 'Used to compress iOS recordings after capture.',
                        detail: 'ffmpeg was not found in PATH.',
                        blocking: false,
                    },
                ],
            };
        },
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.deepEqual(observedPlatforms, [common_1.PLATFORM_ANDROID, common_1.PLATFORM_IOS]);
    strict_1.default.match(printed, /Ready/);
    strict_1.default.match(printed, /Setup Required\n- None/);
    strict_1.default.match(printed, /Warnings/);
});
(0, node_test_1.default)('usb-ui-test check reports an env ambiguity error instead of a parser error when --env is omitted', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'staging.yaml': '{}\n',
            'prod.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Pass --env <name>\. Available environments: prod, staging/);
        strict_1.default.doesNotMatch(result.stderr, /required option '--env <name>' not specified/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check works without --env when .usb-ui-test/env is absent and the test is env-free', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /using no env bindings\./);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check fails with actionable binding guidance when .usb-ui-test/env is absent and the test references env bindings', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
        testLines: ['name: login', 'steps:', '  - Enter ${secrets.email} on the login screen.'],
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /no environment configuration was resolved/);
        strict_1.default.match(result.stderr, /\$\{secrets\.email\}/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check rejects tests with preconditions keys', async () => {
    const rootDir = createTempWorkspace({
        testLines: [
            'name: login',
            'preconditions:',
            '  - App is installed.',
            'steps:',
            '  - Open the login screen.',
        ],
    });
    try {
        const result = runCli(['check'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /contains unsupported key "preconditions"/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check accepts repeated selectors and comma-delimited selectors', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'login.yaml': ['name: login', 'steps:', '  - Open the login screen.'].join('\n'),
            'auth/profile/edit.yaml': ['name: edit', 'steps:', '  - Edit the profile.'].join('\n'),
        },
    });
    try {
        const repeatedResult = runCli(['check', 'login.yaml', 'auth/profile/edit.yaml'], rootDir);
        strict_1.default.equal(repeatedResult.status, 0);
        strict_1.default.match(repeatedResult.stdout, /Validated 2 test\(s\)/);
        strict_1.default.equal(repeatedResult.stderr, '');
        const commaResult = runCli(['check', 'login.yaml,auth/profile/edit.yaml'], rootDir);
        strict_1.default.equal(commaResult.status, 0);
        strict_1.default.match(commaResult.stdout, /Validated 2 test\(s\)/);
        strict_1.default.equal(commaResult.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test check validates suite manifests with --suite', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'login.yaml': ['name: login', 'steps:', '  - Open the login screen.'].join('\n'),
            'dashboard/home.yaml': ['name: home', 'steps:', '  - Open dashboard.'].join('\n'),
        },
        suites: {
            'login_suite.yaml': [
                'name: login suite',
                'tests:',
                '  - login.yaml',
                '  - dashboard/**',
            ].join('\n'),
        },
    });
    try {
        const result = runCli(['check', '--suite', 'login_suite.yaml'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /Validated 2 test\(s\)/);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test resolves nested test paths without requiring the .usb-ui-test/tests prefix', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: google/gemini-3-flash-preview\n',
        testFiles: {
            'login/auth.yaml': ['name: auth login', 'steps:', '  - Open auth login.'].join('\n'),
        },
    });
    try {
        const result = runCli(['test', 'login/auth.yaml'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /API key is required for provider "google"\. Provide via --api-key or GOOGLE_API_KEY\./);
        strict_1.default.doesNotMatch(result.stderr, /Test file not found/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test suite resolves suite manifests without requiring the .usb-ui-test/suites prefix', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: google/gemini-3-flash-preview\n',
        testFiles: {
            'login/auth.yaml': ['name: auth login', 'steps:', '  - Open auth login.'].join('\n'),
        },
        suites: {
            'login/auth_suite.yaml': ['name: auth suite', 'tests:', '  - login/auth.yaml'].join('\n'),
        },
    });
    try {
        const result = runCli(['suite', 'login/auth_suite.yaml'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /API key is required for provider "google"\. Provide via --api-key or GOOGLE_API_KEY\./);
        strict_1.default.doesNotMatch(result.stderr, /Suite manifest not found/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test rejects --suite flag as an unknown option', async () => {
    const rootDir = createTempWorkspace({
        suites: {
            'login_suite.yaml': ['name: login suite', 'tests:', '  - login.yaml'].join('\n'),
        },
    });
    try {
        const result = runCli(['test', '--suite', 'login_suite.yaml'], rootDir);
        strict_1.default.notEqual(result.status, 0);
        strict_1.default.match(result.stderr, /unknown option '--suite'/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test reports missing selectors before API key validation', async () => {
    const rootDir = createTempWorkspace();
    try {
        const result = runCli(['test'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /At least one test selector is required/);
        strict_1.default.doesNotMatch(result.stderr, /API key is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test requires --model before resolving the workspace environment', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'prod.yaml': '{}\n',
            'staging.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /--model is required\. Use provider\/model, for example google\/gemini-3-flash-preview\. Supported providers: openai, google, anthropic\./);
        strict_1.default.doesNotMatch(result.stderr, /Pass --env <name>\. Available environments:/);
        strict_1.default.doesNotMatch(result.stderr, /API key is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test uses .usb-ui-test/config.yaml model when --model is omitted', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: google/gemini-3-flash-preview\n',
    });
    try {
        const result = runCli(['test', 'login.yaml'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /API key is required for provider "google"\. Provide via --api-key or GOOGLE_API_KEY\./);
        strict_1.default.doesNotMatch(result.stderr, /--model is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test validates malformed config models before resolving the workspace environment', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: not-a-provider-model\n',
        envFiles: {
            'prod.yaml': '{}\n',
            'staging.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Invalid model format: "not-a-provider-model"\. Expected provider\/model with non-empty provider and model name\. Supported providers: openai, google, anthropic\./);
        strict_1.default.doesNotMatch(result.stderr, /Pass --env <name>\. Available environments:/);
        strict_1.default.doesNotMatch(result.stderr, /API key is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test validates unsupported config providers before resolving the workspace environment', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: bedrock/claude\n',
        envFiles: {
            'prod.yaml': '{}\n',
            'staging.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Unsupported AI provider: "bedrock"\. Supported providers: openai, google, anthropic\./);
        strict_1.default.doesNotMatch(result.stderr, /Pass --env <name>\. Available environments:/);
        strict_1.default.doesNotMatch(result.stderr, /API key is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test uses .usb-ui-test/config.yaml env when --env is omitted', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['env: staging', 'model: google/gemini-3-flash-preview'].join('\n'),
        envFiles: {
            'prod.yaml': '{}\n',
            'staging.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /API key is required for provider "google"\. Provide via --api-key or GOOGLE_API_KEY\./);
        strict_1.default.doesNotMatch(result.stderr, /Pass --env <name>\. Available environments:/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prefers explicit --model over .usb-ui-test/config.yaml model', async () => {
    const rootDir = createTempWorkspace({
        configYaml: 'model: bedrock/claude\n',
    });
    try {
        const result = runCli(['test', 'login.yaml', '--model', 'google/gemini-3-flash-preview'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /API key is required for provider "google"\. Provide via --api-key or GOOGLE_API_KEY\./);
        strict_1.default.doesNotMatch(result.stderr, /Unsupported AI provider: "bedrock"/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prefers explicit --env over .usb-ui-test/config.yaml env', async () => {
    const rootDir = createTempWorkspace({
        configYaml: ['env: qa', 'model: google/gemini-3-flash-preview'].join('\n'),
        envFiles: {
            'prod.yaml': '{}\n',
            'staging.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml', '--env', 'prod'], rootDir, EMPTY_PROVIDER_ENV_VARS);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /API key is required for provider "google"\. Provide via --api-key or GOOGLE_API_KEY\./);
        strict_1.default.doesNotMatch(result.stderr, /Environment "qa" was not found/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test rejects unsupported providers before resolving the workspace environment', async () => {
    const rootDir = createTempWorkspace({
        envFiles: {
            'prod.yaml': '{}\n',
            'staging.yaml': '{}\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml', '--model', 'bedrock/claude'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Unsupported AI provider: "bedrock"\. Supported providers: openai, google, anthropic\./);
        strict_1.default.doesNotMatch(result.stderr, /Pass --env <name>\. Available environments:/);
        strict_1.default.doesNotMatch(result.stderr, /API key is required/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prints blocked Android preflight failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace();
    try {
        const result = runCli(['test', 'login.yaml', '--platform', 'android', '--model', 'openai/gpt-5.4-mini'], rootDir, {
            OPENAI_API_KEY: 'test-key',
            PATH: '',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Run setup failed before execution:/);
        strict_1.default.match(result.stderr, /Local device setup is blocked for android\./i);
        strict_1.default.match(result.stderr, /scrcpy not found/i);
        strict_1.default.match(result.stderr, /usb-ui-test doctor --platform android/);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prints missing test selector failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace();
    try {
        const result = runCli(['test', 'missing.yaml', '--model', 'openai/gpt-5.4-mini'], rootDir, {
            OPENAI_API_KEY: 'test-key',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Test file not found:/);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test suite prints missing manifest failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace({
        includeSuitesDir: true,
    });
    try {
        const result = runCli(['suite', 'missing_suite.yaml', '--model', 'openai/gpt-5.4-mini'], rootDir, {
            OPENAI_API_KEY: 'test-key',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Suite manifest not found:/);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prints invalid YAML failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace({
        testFiles: {
            'login.yaml': 'name: login\nsteps: [\n',
        },
    });
    try {
        const result = runCli(['test', 'login.yaml', '--model', 'openai/gpt-5.4-mini'], rootDir, {
            OPENAI_API_KEY: 'test-key',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Invalid YAML in/);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prints unresolved env binding failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace({
        includeEnvDir: false,
        testLines: ['name: login', 'steps:', '  - Enter ${secrets.email} on the login screen.'],
    });
    try {
        const result = runCli(['test', 'login.yaml', '--model', 'openai/gpt-5.4-mini'], rootDir, {
            OPENAI_API_KEY: 'test-key',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /no environment configuration was resolved/);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prints unsupported app override failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace();
    const badAppPath = node_path_1.default.join(rootDir, 'fake-app.txt');
    node_fs_1.default.writeFileSync(badAppPath, 'not an app bundle', 'utf-8');
    try {
        const result = runCli(['test', 'login.yaml', '--model', 'openai/gpt-5.4-mini', '--app', badAppPath], rootDir, {
            OPENAI_API_KEY: 'test-key',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Unsupported --app override/);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test test prints device setup failures raw and does not create a run', async () => {
    const rootDir = createTempWorkspace();
    try {
        const result = runCli(['test', 'login.yaml', '--model', 'openai/gpt-5.4-mini', '--platform', 'android'], rootDir, {
            OPENAI_API_KEY: 'test-key',
            USB_UI_TEST_CLI_TEST_SKIP_HOST_PREFLIGHT: '1',
            USB_UI_TEST_CLI_TEST_FORCE_DEVICE_SETUP_FAILURE: 'No runnable devices or startable targets were found.',
        });
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stdout, /Using Android package: org\.wikipedia/);
        strict_1.default.match(result.stderr, /Run setup failed before execution:/);
        strict_1.default.match(result.stderr, /No runnable devices or startable targets were found\./);
        assertNoRunOutput(result);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test start-server reports guidance outside a UsbUiTest repo when --workspace is omitted', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-no-workspace-'));
    try {
        const result = runCli(['start-server'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Pass --workspace <path> to target a UsbUiTest workspace explicitly/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test start-server ignores a parent .usb-ui-test home directory without tests', async () => {
    const fakeHomeDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-fake-home-'));
    const outsideDir = node_path_1.default.join(fakeHomeDir, 'projects', 'outside');
    node_fs_1.default.mkdirSync(node_path_1.default.join(fakeHomeDir, '.usb-ui-test'), { recursive: true });
    node_fs_1.default.mkdirSync(outsideDir, { recursive: true });
    try {
        const result = runCli(['start-server'], outsideDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Pass --workspace <path> to target a UsbUiTest workspace explicitly/);
        strict_1.default.doesNotMatch(result.stderr, /Missing \.usb-ui-test\/tests directory/);
    }
    finally {
        await promises_1.default.rm(fakeHomeDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test start-server --help shows --workspace and top-level stop/status commands are available', async () => {
    const rootDir = createTempWorkspace();
    try {
        const startHelp = runCli(['start-server', '--help'], rootDir);
        const stopHelp = runCli(['stop-server', '--help'], rootDir);
        const statusHelp = runCli(['server-status', '--help'], rootDir);
        strict_1.default.equal(startHelp.status, 0);
        strict_1.default.match(startHelp.stdout, /--workspace <path>/);
        strict_1.default.equal(stopHelp.status, 0);
        strict_1.default.match(stopHelp.stdout, /stop the local usb-ui-test report server/i);
        strict_1.default.match(stopHelp.stdout, /--workspace <path>/);
        strict_1.default.equal(statusHelp.status, 0);
        strict_1.default.match(statusHelp.stdout, /show the local usb-ui-test report server status/i);
        strict_1.default.match(statusHelp.stdout, /--workspace <path>/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test report serve is rejected after the breaking command removal', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-no-report-workspace-'));
    try {
        const result = runCli(['report', 'serve'], rootDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /unknown command 'report'/i);
        const reportHelp = runCli(['report', '--help'], rootDir);
        strict_1.default.equal(reportHelp.status, 0);
        strict_1.default.doesNotMatch(reportHelp.stdout, /^\s+report\b/m);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test runs --json prints the saved runs index', async () => {
    const rootDir = createTempWorkspace();
    const workspace = await resolveWorkspaceForHome(rootDir, CLI_TEST_HOME);
    const artifactsDir = workspace.artifactsDir;
    await promises_1.default.mkdir(artifactsDir, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(artifactsDir, 'runs.json'), JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-03-23T18:00:00.000Z',
        runs: [
            {
                runId: '2026-03-23T18-00-00.000Z-dev-android',
                success: false,
                status: 'failure',
                startedAt: '2026-03-23T18:00:00.000Z',
                completedAt: '2026-03-23T18:00:10.000Z',
                durationMs: 10000,
                envName: 'dev',
                platform: 'android',
                modelLabel: 'openai/gpt-5.4-mini',
                appLabel: 'repo app',
                testCount: 1,
                passedCount: 0,
                failedCount: 1,
                stepCount: 1,
                paths: {
                    runJson: '2026-03-23T18-00-00.000Z-dev-android/run.json',
                    log: '2026-03-23T18-00-00.000Z-dev-android/runner.log',
                },
            },
        ],
    }, null, 2), 'utf-8');
    try {
        const result = runCli(['runs', '--json'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /"runId": "2026-03-23T18-00-00.000Z-dev-android"/);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test runs prints a console summary and suggests starting the local report UI', async () => {
    const rootDir = createTempWorkspace();
    const workspace = await resolveWorkspaceForHome(rootDir, CLI_TEST_HOME);
    const artifactsDir = workspace.artifactsDir;
    await promises_1.default.mkdir(artifactsDir, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(artifactsDir, 'runs.json'), JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-03-23T18:00:00.000Z',
        runs: [
            {
                runId: '2026-03-23T18-00-00.000Z-dev-android',
                success: true,
                status: 'success',
                startedAt: '2026-03-23T18:00:00.000Z',
                completedAt: '2026-03-23T18:00:10.000Z',
                durationMs: 10000,
                envName: 'dev',
                platform: 'android',
                modelLabel: 'openai/gpt-5.4-mini',
                appLabel: 'repo app',
                testCount: 2,
                passedCount: 2,
                failedCount: 0,
                stepCount: 4,
                paths: {
                    runJson: '2026-03-23T18-00-00.000Z-dev-android/run.json',
                    log: '2026-03-23T18-00-00.000Z-dev-android/runner.log',
                },
            },
        ],
    }, null, 2), 'utf-8');
    try {
        const result = runCli(['runs'], rootDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /PASS/);
        strict_1.default.match(result.stdout, /usb-ui-test start-server --workspace "/);
        strict_1.default.match(result.stdout, new RegExp(`${node_path_1.default.basename(workspace.rootDir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\"`));
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test start-server rejects malformed and out-of-range --port values', async () => {
    const rootDir = createTempWorkspace();
    try {
        const malformedPortResult = runCli(['start-server', '--port', '4173foo'], rootDir, { USB_UI_TEST_DISABLE_BROWSER: '1' });
        strict_1.default.equal(malformedPortResult.status, 1);
        strict_1.default.match(malformedPortResult.stderr, /Invalid --port value "4173foo"/);
        const outOfRangePortResult = runCli(['start-server', '--port', '70000'], rootDir, { USB_UI_TEST_DISABLE_BROWSER: '1' });
        strict_1.default.equal(outOfRangePortResult.status, 1);
        strict_1.default.match(outOfRangePortResult.stderr, /Invalid --port value "70000"/);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test runs --workspace works from outside any workspace', async () => {
    const workspaceRoot = createTempWorkspace();
    const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-outside-runs-'));
    const workspace = await resolveWorkspaceForHome(workspaceRoot, CLI_TEST_HOME);
    await promises_1.default.mkdir(workspace.artifactsDir, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(workspace.artifactsDir, 'runs.json'), JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-03-23T18:00:00.000Z',
        runs: [
            {
                runId: '2026-03-23T18-00-00.000Z-dev-android',
                success: true,
                status: 'success',
                startedAt: '2026-03-23T18:00:00.000Z',
                completedAt: '2026-03-23T18:00:10.000Z',
                durationMs: 10000,
                envName: 'dev',
                platform: 'android',
                modelLabel: 'openai/gpt-5.4-mini',
                appLabel: 'repo app',
                testCount: 1,
                passedCount: 1,
                failedCount: 0,
                stepCount: 1,
                paths: {
                    runJson: '2026-03-23T18-00-00.000Z-dev-android/run.json',
                    log: '2026-03-23T18-00-00.000Z-dev-android/runner.log',
                },
            },
        ],
    }, null, 2), 'utf-8');
    try {
        const result = runCli(['runs', '--workspace', workspaceRoot, '--json'], outsideDir);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /"runId": "2026-03-23T18-00-00.000Z-dev-android"/);
        strict_1.default.equal(result.stderr, '');
    }
    finally {
        await promises_1.default.rm(workspaceRoot, { recursive: true, force: true });
        await promises_1.default.rm(outsideDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test runs --workspace overrides the current workspace', async () => {
    const currentWorkspaceRoot = createTempWorkspace();
    const targetWorkspaceRoot = createTempWorkspace();
    const currentWorkspace = await resolveWorkspaceForHome(currentWorkspaceRoot, CLI_TEST_HOME);
    const targetWorkspace = await resolveWorkspaceForHome(targetWorkspaceRoot, CLI_TEST_HOME);
    await promises_1.default.mkdir(currentWorkspace.artifactsDir, { recursive: true });
    await promises_1.default.mkdir(targetWorkspace.artifactsDir, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(currentWorkspace.artifactsDir, 'runs.json'), JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-03-23T18:00:00.000Z',
        runs: [],
    }, null, 2), 'utf-8');
    await promises_1.default.writeFile(node_path_1.default.join(targetWorkspace.artifactsDir, 'runs.json'), JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-03-23T18:00:00.000Z',
        runs: [
            {
                runId: '2026-03-23T19-00-00.000Z-dev-ios',
                success: true,
                status: 'success',
                startedAt: '2026-03-23T19:00:00.000Z',
                completedAt: '2026-03-23T19:00:20.000Z',
                durationMs: 20000,
                envName: 'dev',
                platform: 'ios',
                modelLabel: 'openai/gpt-5.4-mini',
                appLabel: 'repo app',
                testCount: 2,
                passedCount: 2,
                failedCount: 0,
                stepCount: 2,
                paths: {
                    runJson: '2026-03-23T19-00-00.000Z-dev-ios/run.json',
                    log: '2026-03-23T19-00-00.000Z-dev-ios/runner.log',
                },
            },
        ],
    }, null, 2), 'utf-8');
    try {
        const result = runCli(['runs', '--workspace', targetWorkspaceRoot, '--json'], currentWorkspaceRoot);
        strict_1.default.equal(result.status, 0);
        strict_1.default.match(result.stdout, /2026-03-23T19-00-00.000Z-dev-ios/);
        strict_1.default.doesNotMatch(result.stdout, /"runs": \[\]/);
    }
    finally {
        await promises_1.default.rm(currentWorkspaceRoot, { recursive: true, force: true });
        await promises_1.default.rm(targetWorkspaceRoot, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test runs reports a clear error for an invalid explicit workspace path', async () => {
    const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-invalid-workspace-'));
    try {
        const result = runCli(['runs', '--workspace', node_path_1.default.join(outsideDir, 'missing-workspace')], outsideDir);
        strict_1.default.equal(result.status, 1);
        strict_1.default.match(result.stderr, /Path is not inside a UsbUiTest workspace/);
    }
    finally {
        await promises_1.default.rm(outsideDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('usb-ui-test start-server, server-status, and stop-server work from outside a workspace with --workspace', async () => {
    const workspaceRoot = createTempWorkspace();
    const outsideDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-server-outside-'));
    const port = await findAvailablePort();
    const workspace = await resolveWorkspaceForHome(workspaceRoot, CLI_TEST_HOME);
    try {
        const startResult = runCli(['start-server', '--workspace', workspaceRoot, '--port', String(port)], outsideDir, {
            USB_UI_TEST_DISABLE_BROWSER: '1',
        });
        strict_1.default.equal(startResult.status, 0);
        strict_1.default.match(startResult.stdout, new RegExp(`http://127\\.0\\.0\\.1:${port}`));
        const statusResult = runCli(['server-status', '--workspace', workspaceRoot], outsideDir, {
            USB_UI_TEST_DISABLE_BROWSER: '1',
        });
        strict_1.default.equal(statusResult.status, 0);
        strict_1.default.match(statusResult.stdout, /UsbUiTest report server status/);
        strict_1.default.match(statusResult.stdout, new RegExp(`Workspace root: ${workspaceRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        strict_1.default.match(statusResult.stdout, new RegExp(`URL: http://127\\.0\\.0\\.1:${port}`));
        strict_1.default.match(statusResult.stdout, /Healthy: yes/);
        const stopResult = runCli(['stop-server', '--workspace', workspaceRoot], outsideDir, {
            USB_UI_TEST_DISABLE_BROWSER: '1',
        });
        strict_1.default.equal(stopResult.status, 0);
        strict_1.default.match(stopResult.stdout, /Stopped UsbUiTest report server/);
        await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(workspace.artifactsDir, '.server.json')));
        const stoppedStatusResult = runCli(['server-status', '--workspace', workspaceRoot], outsideDir, {
            USB_UI_TEST_DISABLE_BROWSER: '1',
        });
        strict_1.default.equal(stoppedStatusResult.status, 0);
        strict_1.default.match(stoppedStatusResult.stdout, /is not running/);
    }
    finally {
        runCli(['stop-server', '--workspace', workspaceRoot], outsideDir, {
            USB_UI_TEST_DISABLE_BROWSER: '1',
        });
        await promises_1.default.rm(workspaceRoot, { recursive: true, force: true });
        await promises_1.default.rm(outsideDir, { recursive: true, force: true });
    }
});
//# sourceMappingURL=usb-ui-test.test.js.map