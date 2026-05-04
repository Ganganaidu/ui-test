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
const common_1 = require("@usb-ui-test/common");
const reportWriter_js_1 = require("./reportWriter.js");
const sessionRunner_js_1 = require("./sessionRunner.js");
const testRunner_js_1 = require("./testRunner.js");
const workspace_js_1 = require("./workspace.js");
function createDevice(platform) {
    return {
        getPlatform() {
            return platform;
        },
    };
}
function createTestExecutionResult(params) {
    const result = {
        success: true,
        message: 'Opened the app successfully.',
        analysis: 'The flow completed successfully.',
        platform: 'android',
        startedAt: '2026-03-17T18:00:00.000Z',
        completedAt: '2026-03-17T18:00:01.000Z',
        totalIterations: 1,
        steps: [
            {
                iteration: 1,
                action: 'tap',
                reason: 'Open the app.',
                naturalLanguageAction: 'Step 1: Open the app.',
                analysis: 'Opened the app from the home screen.',
                thought: {
                    plan: 'Bring the app to the foreground.',
                    think: 'The flow is ready to execute.',
                    act: 'Open the app.',
                },
                actionPayload: {},
                success: true,
                timestamp: '2026-03-17T18:00:00.500Z',
                durationMs: 500,
            },
        ],
        ...params,
    };
    return {
        ...result,
        status: result.status ?? (result.success ? 'success' : 'failure'),
    };
}
function createTestSession(params) {
    return {
        platform: params?.platform ?? 'android',
        deviceInfo: {},
        deviceNode: {},
        device: {},
        async cleanup() {
            await params?.cleanup?.();
        },
    };
}
function writeWorkspaceConfig(rootDir, platforms = 'android') {
    const lines = ['app:'];
    if (platforms === 'android' || platforms === 'both') {
        lines.push('  packageName: org.wikipedia');
    }
    if (platforms === 'ios' || platforms === 'both') {
        lines.push('  bundleId: org.wikipedia');
    }
    node_fs_1.default.mkdirSync(node_path_1.default.join(rootDir, '.usb-ui-test'), { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(rootDir, '.usb-ui-test', 'config.yaml'), `${lines.join('\n')}\n`, 'utf-8');
}
const originalRunHostPreflight = testRunner_js_1.testRunnerDependencies.runHostPreflight;
node_test_1.default.beforeEach(() => {
    testRunner_js_1.testRunnerDependencies.runHostPreflight = async ({ requestedPlatforms }) => ({
        requestedPlatforms,
        checks: [],
    });
});
node_test_1.default.afterEach(() => {
    testRunner_js_1.testRunnerDependencies.runHostPreflight = originalRunHostPreflight;
});
async function assertNoRunArtifacts(cwd) {
    const workspace = await (0, workspace_js_1.resolveWorkspace)(cwd);
    const artifactEntries = await promises_1.default.readdir(workspace.artifactsDir).catch(() => []);
    strict_1.default.deepEqual(artifactEntries, []);
    await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(workspace.artifactsDir, 'runs.json')));
}
(0, node_test_1.default)('selectExecutionPlatform requires an explicit platform when Android and iOS devices are both available', () => {
    strict_1.default.throws(() => (0, testRunner_js_1.selectExecutionPlatform)([createDevice('android'), createDevice('ios')]), /Choose --platform android or --platform ios/);
});
(0, node_test_1.default)('selectExecutionPlatform honors the requested platform when it is available', () => {
    const platform = (0, testRunner_js_1.selectExecutionPlatform)([createDevice('android'), createDevice('ios')], 'ios');
    strict_1.default.equal(platform, 'ios');
});
(0, node_test_1.default)('redactResolvedValue preserves complete placeholders when secrets overlap', () => {
    const redacted = (0, common_1.redactResolvedValue)('primary=abcd secondary=abc', {
        secrets: {
            short: 'abc',
            long: 'abcd',
        },
        variables: {},
    });
    strict_1.default.equal(redacted, 'primary=${secrets.long} secondary=${secrets.short}');
});
(0, node_test_1.default)('ReportWriter emits redacted JSON artifacts and input snapshots without persisted HTML', async () => {
    const runDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-report-'));
    const workspaceRoot = node_path_1.default.join(runDir, 'workspace');
    const testSourcePath = node_path_1.default.join(workspaceRoot, '.usb-ui-test', 'tests', 'auth', 'login.yaml');
    const envPath = node_path_1.default.join(workspaceRoot, '.usb-ui-test', 'env', 'staging.yaml');
    const writer = new reportWriter_js_1.ReportWriter({
        runDir,
        envName: 'staging',
        platform: 'android',
        runId: '2026-03-16T10-30-00.000Z-staging-android',
        bindings: {
            secrets: {
                email: 'person@example.com',
            },
            variables: {
                language: 'Spanish',
            },
        },
    });
    const bindings = {
        secrets: {
            email: 'person@example.com',
        },
        variables: {
            language: 'Spanish',
        },
    };
    const testDef = {
        name: 'login',
        description: 'Verify a user can log in.',
        setup: [],
        steps: ['Enter ${secrets.email} on the login screen.'],
        expected_state: ['The feed is visible.'],
        sourcePath: testSourcePath,
        relativePath: 'auth/login.yaml',
        testId: 'auth__login',
    };
    const screenshot = `data:image/jpeg;base64,${Buffer.from('fake-jpeg-data').toString('base64')}`;
    const recordingPath = node_path_1.default.join(runDir, 'source-recording.mp4');
    const goalResult = {
        success: true,
        status: 'success',
        message: 'Entered person@example.com and opened the feed.',
        analysis: 'Entered person@example.com and verified the feed.',
        platform: 'android',
        startedAt: '2026-03-16T10:30:00.000Z',
        completedAt: '2026-03-16T10:30:02.000Z',
        totalIterations: 1,
        recording: {
            filePath: recordingPath,
            startedAt: '2026-03-16T10:30:00.000Z',
            completedAt: '2026-03-16T10:30:02.000Z',
        },
        steps: [
            {
                iteration: 1,
                action: 'input_text',
                reason: 'Enter ${secrets.email} on the login screen.',
                naturalLanguageAction: 'Step 1: Enter ${secrets.email}.',
                analysis: 'Typed person@example.com into the email field.',
                thought: {
                    plan: 'Focus the email field.',
                    think: 'Use the stored login credential.',
                    act: 'Enter ${secrets.email}.',
                },
                actionPayload: {
                    text: 'person@example.com',
                    clearText: true,
                },
                success: true,
                screenshot,
                timestamp: '2026-03-16T10:30:01.000Z',
                durationMs: 1200,
                trace: {
                    step: 1,
                    action: 'input_text',
                    status: 'failure',
                    totalMs: 1200,
                    failureReason: 'Failed after typing person@example.com.',
                    spans: [
                        {
                            name: 'action.prep',
                            startMs: 0,
                            durationMs: 150,
                            status: 'failure',
                            detail: 'device rejected person@example.com',
                        },
                    ],
                },
                timing: {
                    totalMs: 1200,
                    spans: [
                        {
                            name: 'action.device',
                            durationMs: 900,
                            status: 'failure',
                            detail: 'driver echoed person@example.com',
                        },
                    ],
                },
            },
        ],
    };
    try {
        await promises_1.default.mkdir(node_path_1.default.dirname(testSourcePath), { recursive: true });
        await promises_1.default.mkdir(node_path_1.default.dirname(envPath), { recursive: true });
        await promises_1.default.writeFile(testSourcePath, [
            'name: login',
            'description: Verify a user can log in.',
            'steps:',
            '  - Enter ${secrets.email} on the login screen.',
            'expected_state:',
            '  - The feed is visible.',
        ].join('\n'), 'utf-8');
        await promises_1.default.writeFile(envPath, [
            'secrets:',
            '  email: ${USB_UI_TEST_TEST_EMAIL_SECRET}',
            'variables:',
            '  language: Spanish',
        ].join('\n'), 'utf-8');
        await promises_1.default.writeFile(recordingPath, 'fake-video-data', 'utf-8');
        await writer.init();
        await writer.writeRunInputs({
            workspaceRoot,
            environment: {
                envName: 'staging',
                envPath,
                config: {
                    secrets: {
                        email: '${USB_UI_TEST_TEST_EMAIL_SECRET}',
                    },
                    variables: {
                        language: 'Spanish',
                    },
                },
                bindings,
                secretReferences: [
                    {
                        key: 'email',
                        envVar: 'USB_UI_TEST_TEST_EMAIL_SECRET',
                    },
                ],
            },
            tests: [testDef],
            effectiveGoals: new Map([
                [testDef.testId, 'Test Name: login\n\nSteps:\n1. Enter ${secrets.email}.'],
            ]),
            target: {
                type: 'direct',
            },
            cli: {
                command: 'usb-ui-test test',
                selectors: ['auth/login.yaml'],
                debug: false,
                maxIterations: 110,
            },
            model: {
                provider: 'openai',
                modelName: 'gpt-5.4-mini',
                label: 'openai/gpt-5.4-mini',
            },
            app: {
                source: 'repo',
                label: 'repo app',
            },
        });
        writer.appendLogLine('report writer smoke check for person@example.com');
        writer.createLoggerSink()({
            level: 1,
            levelName: 'INFO',
            message: 'Planner failed for person@example.com',
            args: [],
            renderedMessage: '[usb-ui-test] Planner failed for person@example.com',
            timestamp: '2026-03-16T10:30:00.500Z',
            tag: 'usb-ui-test',
        });
        const testRecord = await writer.writeTestRecord(testDef, goalResult, bindings);
        await writer.finalize({
            startedAt: goalResult.startedAt,
            completedAt: goalResult.completedAt,
            tests: [testRecord],
        });
        const stepJsonPath = node_path_1.default.join(runDir, 'tests', 'auth__login', 'actions', '001.json');
        const screenshotPath = node_path_1.default.join(runDir, 'tests', 'auth__login', 'screenshots', '001.jpg');
        const recordingArtifactPath = node_path_1.default.join(runDir, 'tests', 'auth__login', 'recording.mp4');
        const resultJsonPath = node_path_1.default.join(runDir, 'tests', 'auth__login', 'result.json');
        const summaryJsonPath = node_path_1.default.join(runDir, 'summary.json');
        const runJsonPath = node_path_1.default.join(runDir, 'run.json');
        const runnerLogPath = node_path_1.default.join(runDir, 'runner.log');
        const testSnapshotYamlPath = node_path_1.default.join(runDir, 'input', 'tests', 'auth__login.yaml');
        const testSnapshotJsonPath = node_path_1.default.join(runDir, 'input', 'tests', 'auth__login.json');
        const envSnapshotYamlPath = node_path_1.default.join(runDir, 'input', 'env.snapshot.yaml');
        const envSnapshotJsonPath = node_path_1.default.join(runDir, 'input', 'env.json');
        for (const target of [
            stepJsonPath,
            screenshotPath,
            recordingArtifactPath,
            resultJsonPath,
            summaryJsonPath,
            runJsonPath,
            runnerLogPath,
            testSnapshotYamlPath,
            testSnapshotJsonPath,
            envSnapshotYamlPath,
            envSnapshotJsonPath,
        ]) {
            const stats = await promises_1.default.stat(target);
            strict_1.default.equal(stats.isFile(), true);
        }
        const stepJson = await promises_1.default.readFile(stepJsonPath, 'utf-8');
        const runJson = await promises_1.default.readFile(runJsonPath, 'utf-8');
        const runnerLog = await promises_1.default.readFile(runnerLogPath, 'utf-8');
        strict_1.default.equal(stepJson.includes('person@example.com'), false);
        strict_1.default.equal(stepJson.includes('${secrets.email}'), true);
        strict_1.default.equal(runJson.includes('person@example.com'), false);
        strict_1.default.equal(runJson.includes('${secrets.email}'), true);
        strict_1.default.equal(stepJson.includes('driver echoed ${secrets.email}'), true);
        strict_1.default.equal(runJson.includes('"target": {\n      "type": "direct"'), true);
        strict_1.default.equal(stepJson.includes('"videoOffsetMs": 1000'), true);
        strict_1.default.equal(runnerLog.includes('person@example.com'), false);
        strict_1.default.equal(runnerLog.includes('${secrets.email}'), true);
        await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(runDir, 'index.html')));
    }
    finally {
        await promises_1.default.rm(runDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('ReportWriter persists suite snapshots and suite metadata without changing per-test result files', async () => {
    const runDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-suite-report-'));
    const workspaceRoot = node_path_1.default.join(runDir, 'workspace');
    const testSourcePath = node_path_1.default.join(workspaceRoot, '.usb-ui-test', 'tests', 'login', 'valid_login.yaml');
    const suiteSourcePath = node_path_1.default.join(workspaceRoot, '.usb-ui-test', 'suites', 'login_suite.yaml');
    const writer = new reportWriter_js_1.ReportWriter({
        runDir,
        envName: 'none',
        platform: 'android',
        runId: '2026-03-24T08-10-11.000Z-none-android',
        bindings: {
            secrets: {},
            variables: {},
        },
    });
    const testDef = {
        name: 'valid login',
        setup: [],
        steps: ['Open login.', 'Submit valid credentials.'],
        expected_state: ['The dashboard is visible.'],
        sourcePath: testSourcePath,
        relativePath: 'login/valid_login.yaml',
        testId: 'login__valid_login',
    };
    try {
        await promises_1.default.mkdir(node_path_1.default.dirname(testSourcePath), { recursive: true });
        await promises_1.default.mkdir(node_path_1.default.dirname(suiteSourcePath), { recursive: true });
        await promises_1.default.writeFile(testSourcePath, [
            'name: valid login',
            'steps:',
            '  - Open login.',
            '  - Submit valid credentials.',
            'expected_state:',
            '  - The dashboard is visible.',
        ].join('\n'), 'utf-8');
        await promises_1.default.writeFile(suiteSourcePath, [
            'name: login suite',
            'description: Covers login and dashboard smoke paths.',
            'tests:',
            '  - login/valid_login.yaml',
            '  - dashboard/**',
        ].join('\n'), 'utf-8');
        await writer.init();
        await writer.writeRunInputs({
            workspaceRoot,
            environment: {
                envName: 'none',
                config: {
                    secrets: {},
                    variables: {},
                },
                bindings: {
                    secrets: {},
                    variables: {},
                },
                secretReferences: [],
            },
            tests: [testDef],
            suite: {
                name: 'login suite',
                description: 'Covers login and dashboard smoke paths.',
                tests: ['login/valid_login.yaml', 'dashboard/**'],
                sourcePath: suiteSourcePath,
                relativePath: 'login_suite.yaml',
                suiteId: 'login_suite',
            },
            effectiveGoals: new Map([
                [
                    testDef.testId,
                    'Test Name: valid login\n\nSteps:\n1. Open login.\n2. Submit valid credentials.',
                ],
            ]),
            target: {
                type: 'suite',
                suiteId: 'login_suite',
                suiteName: 'login suite',
                suitePath: 'login_suite.yaml',
            },
            cli: {
                command: 'usb-ui-test suite login_suite.yaml',
                selectors: [],
                suitePath: 'login_suite.yaml',
                debug: false,
            },
            model: {
                provider: 'openai',
                modelName: 'gpt-5.4-mini',
                label: 'openai/gpt-5.4-mini',
            },
            app: {
                source: 'repo',
                label: 'repo app',
            },
        });
        const testRecord = await writer.writeTestRecord(testDef, createTestExecutionResult(), {
            secrets: {},
            variables: {},
        });
        await writer.finalize({
            startedAt: '2026-03-24T08:10:11.000Z',
            completedAt: '2026-03-24T08:10:20.000Z',
            tests: [testRecord],
            successOverride: true,
        });
        const suiteSnapshotYamlPath = node_path_1.default.join(runDir, 'input', 'suite.snapshot.yaml');
        const suiteSnapshotJsonPath = node_path_1.default.join(runDir, 'input', 'suite.json');
        const runJsonPath = node_path_1.default.join(runDir, 'run.json');
        const resultJsonPath = node_path_1.default.join(runDir, 'tests', 'login__valid_login', 'result.json');
        for (const targetPath of [
            suiteSnapshotYamlPath,
            suiteSnapshotJsonPath,
            runJsonPath,
            resultJsonPath,
        ]) {
            const stats = await promises_1.default.stat(targetPath);
            strict_1.default.equal(stats.isFile(), true);
        }
        const runJson = JSON.parse(await promises_1.default.readFile(runJsonPath, 'utf-8'));
        const resultJson = JSON.parse(await promises_1.default.readFile(resultJsonPath, 'utf-8'));
        const suiteJson = JSON.parse(await promises_1.default.readFile(suiteSnapshotJsonPath, 'utf-8'));
        strict_1.default.deepEqual(runJson.run.target, {
            type: 'suite',
            suiteId: 'login_suite',
            suiteName: 'login suite',
            suitePath: 'login_suite.yaml',
        });
        strict_1.default.equal(runJson.input.suite.name, 'login suite');
        strict_1.default.equal(runJson.input.suite.description, 'Covers login and dashboard smoke paths.');
        strict_1.default.deepEqual(runJson.input.suite.tests, ['login/valid_login.yaml', 'dashboard/**']);
        strict_1.default.deepEqual(runJson.input.suite.resolvedTestIds, ['login__valid_login']);
        strict_1.default.equal(suiteJson.description, 'Covers login and dashboard smoke paths.');
        strict_1.default.equal(suiteJson.snapshotYamlPath, 'input/suite.snapshot.yaml');
        strict_1.default.equal(resultJson.suiteName, undefined);
        await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(runDir, 'index.html')));
    }
    finally {
        await promises_1.default.rm(runDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('ReportWriter reuses artifact-local recording files without duplicating the copy step', async () => {
    const runDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-artifact-recording-'));
    const writer = new reportWriter_js_1.ReportWriter({
        runDir,
        envName: 'none',
        platform: 'android',
        runId: '2026-03-24T08-10-11.000Z-none-android',
        bindings: {
            secrets: {},
            variables: {},
        },
    });
    const testDef = {
        name: 'login',
        description: 'Verify login.',
        setup: [],
        steps: ['Open login.'],
        expected_state: ['The dashboard is visible.'],
        sourcePath: node_path_1.default.join(runDir, 'workspace', '.usb-ui-test', 'tests', 'login.yaml'),
        relativePath: 'login.yaml',
        testId: 'login',
    };
    const recordingPath = node_path_1.default.join(runDir, 'tests', 'login', 'recording.mp4');
    try {
        await writer.init();
        await promises_1.default.mkdir(node_path_1.default.dirname(recordingPath), { recursive: true });
        await promises_1.default.writeFile(recordingPath, 'artifact-native-recording', 'utf-8');
        const testRecord = await writer.writeTestRecord(testDef, createTestExecutionResult({
            recording: {
                filePath: recordingPath,
                startedAt: '2026-03-17T18:00:00.000Z',
                completedAt: '2026-03-17T18:00:01.000Z',
            },
        }), {
            secrets: {},
            variables: {},
        });
        strict_1.default.equal(testRecord.recordingFile, 'tests/login/recording.mp4');
        strict_1.default.equal(await promises_1.default.readFile(recordingPath, 'utf-8'), 'artifact-native-recording');
    }
    finally {
        await promises_1.default.rm(runDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests finalizes top-level artifacts when shared-session execution throws before a test completes', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-runner-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    const secretEnvVar = 'USB_UI_TEST_TEST_EMAIL_SECRET';
    const previousSecret = process.env[secretEnvVar];
    process.env[secretEnvVar] = 'person@example.com';
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), ['secrets:', `  email: \${${secretEnvVar}}`].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Enter ${secrets.email} on the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let cleanupCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({
        cleanup: async () => {
            cleanupCalls += 1;
        },
    });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async () => {
        throw new Error('Driver failed for person@example.com before goal completion');
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, false);
        strict_1.default.equal(result.testResults.length, 1);
        strict_1.default.equal(result.testResults[0]?.success, false);
        strict_1.default.equal(result.testResults[0]?.message, 'Driver failed for ${secrets.email} before goal completion');
        const summaryPath = node_path_1.default.join(result.runDir, 'summary.json');
        const runJsonPath = node_path_1.default.join(result.runDir, 'run.json');
        const resultPath = node_path_1.default.join(result.runDir, 'tests', 'login', 'result.json');
        const stepPath = node_path_1.default.join(result.runDir, 'tests', 'login', 'actions', '001.json');
        const screenshotPath = node_path_1.default.join(result.runDir, 'tests', 'login', 'screenshots', '001.jpg');
        const runnerLogPath = node_path_1.default.join(result.runDir, 'runner.log');
        for (const target of [
            summaryPath,
            runJsonPath,
            resultPath,
            stepPath,
            screenshotPath,
            runnerLogPath,
            result.runIndexPath,
        ]) {
            const stats = await promises_1.default.stat(target);
            strict_1.default.equal(stats.isFile(), true);
        }
        const summaryJson = await promises_1.default.readFile(summaryPath, 'utf-8');
        const testResultJson = await promises_1.default.readFile(resultPath, 'utf-8');
        const stepJson = await promises_1.default.readFile(stepPath, 'utf-8');
        const runnerLog = await promises_1.default.readFile(runnerLogPath, 'utf-8');
        strict_1.default.equal(summaryJson.includes('person@example.com'), false);
        strict_1.default.equal(summaryJson.includes('${secrets.email}'), false);
        for (const content of [testResultJson, stepJson, runnerLog]) {
            strict_1.default.equal(content.includes('person@example.com'), false);
            strict_1.default.equal(content.includes('${secrets.email}'), true);
        }
        await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(result.runDir, 'index.html')));
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        strict_1.default.equal(cleanupCalls, 1);
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
        if (previousSecret === undefined) {
            delete process.env[secretEnvVar];
        }
        else {
            process.env[secretEnvVar] = previousSecret;
        }
    }
});
(0, node_test_1.default)('runTests succeeds without env config when the repo is env-free', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-env-free-runner-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'smoke.yaml'), ['name: smoke', 'steps:', '  - Open the app.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let cleanupCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({
        cleanup: async () => {
            cleanupCalls += 1;
        },
    });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async () => createTestExecutionResult({
        analysis: 'The env-free smoke flow completed successfully.',
    });
    try {
        const result = await (0, testRunner_js_1.runTests)({
            cwd: rootDir,
            selectors: ['smoke.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, true);
        strict_1.default.equal(result.testResults.length, 1);
        strict_1.default.match(result.runDir, /-none-android$/);
        const summaryPath = node_path_1.default.join(result.runDir, 'summary.json');
        const runJsonPath = node_path_1.default.join(result.runDir, 'run.json');
        const runnerLogPath = node_path_1.default.join(result.runDir, 'runner.log');
        for (const target of [summaryPath, runJsonPath, runnerLogPath, result.runIndexPath]) {
            const stats = await promises_1.default.stat(target);
            strict_1.default.equal(stats.isFile(), true);
        }
        await strict_1.default.rejects(() => promises_1.default.stat(node_path_1.default.join(result.runDir, 'index.html')));
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        strict_1.default.equal(cleanupCalls, 1);
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests records the suite subcommand in run metadata when invoked via usb-ui-test suite', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-suite-command-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const suitesDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'suites');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(suitesDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'smoke.yaml'), ['name: smoke', 'steps:', '  - Open the app.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(suitesDir, 'smoke.yaml'), ['name: smoke suite', 'tests:', '  - smoke.yaml'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let cleanupCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({
        cleanup: async () => {
            cleanupCalls += 1;
        },
    });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async () => createTestExecutionResult();
    try {
        const result = await (0, testRunner_js_1.runTests)({
            cwd: rootDir,
            suitePath: 'smoke.yaml',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
            invokedCommand: 'suite',
        });
        const runJson = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'run.json'), 'utf-8'));
        strict_1.default.equal(runJson.input.cli.command, 'usb-ui-test suite smoke.yaml');
        strict_1.default.equal(runJson.input.cli.suitePath, 'smoke.yaml');
        strict_1.default.deepEqual(runJson.input.cli.selectors, []);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        strict_1.default.equal(cleanupCalls, 1);
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests prepares one shared session for multiple tests and cleans it up once', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-shared-session-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'search.yaml'), ['name: search', 'steps:', '  - Search Wikipedia.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let prepareCalls = 0;
    let cleanupCalls = 0;
    const executedCases = [];
    const recordingOutputPaths = [];
    const keepPartialFlags = [];
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => {
        prepareCalls += 1;
        return createTestSession({
            cleanup: async () => {
                cleanupCalls += 1;
            },
        });
    };
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async (_session, config) => {
        if (config.recording) {
            executedCases.push(config.recording.testId);
            recordingOutputPaths.push(config.recording.outputFilePath ?? '');
            keepPartialFlags.push(config.recording.keepPartialOnFailure ?? false);
        }
        return createTestExecutionResult();
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml', 'search.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, true);
        strict_1.default.equal(result.testResults.length, 2);
        strict_1.default.equal(prepareCalls, 1);
        strict_1.default.equal(cleanupCalls, 1);
        strict_1.default.deepEqual(executedCases, ['login', 'search']);
        strict_1.default.deepEqual(recordingOutputPaths, [
            node_path_1.default.join(result.runDir, 'tests', 'login', 'recording.mp4'),
            node_path_1.default.join(result.runDir, 'tests', 'search', 'recording.mp4'),
        ]);
        strict_1.default.deepEqual(keepPartialFlags, [true, true]);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests uses mov artifact recording output paths for iOS tests', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-ios-recording-output-'));
    writeWorkspaceConfig(rootDir, 'ios');
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    const recordingConfigs = [];
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({ platform: 'ios' });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async (_session, config) => {
        if (config.recording) {
            recordingConfigs.push({
                testId: config.recording.testId,
                outputFilePath: config.recording.outputFilePath,
                keepPartialOnFailure: config.recording.keepPartialOnFailure,
            });
        }
        return createTestExecutionResult({ platform: 'ios' });
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            platform: 'ios',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, true);
        strict_1.default.deepEqual(recordingConfigs, [
            {
                testId: 'login',
                outputFilePath: node_path_1.default.join(result.runDir, 'tests', 'login', 'recording.mov'),
                keepPartialOnFailure: true,
            },
        ]);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests stops the batch after a shared-session failure and cleans up once', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-shared-session-failure-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'first.yaml'), ['name: first', 'steps:', '  - Open first flow.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'second.yaml'), ['name: second', 'steps:', '  - Open second flow.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'third.yaml'), ['name: third', 'steps:', '  - Open third flow.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let cleanupCalls = 0;
    const executedCases = [];
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({
        cleanup: async () => {
            cleanupCalls += 1;
        },
    });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async (_session, config) => {
        const testId = config.recording?.testId ?? 'unknown';
        executedCases.push(testId);
        if (testId === 'second') {
            throw new Error('gRPC client not connected');
        }
        return createTestExecutionResult();
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['first.yaml', 'second.yaml', 'third.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, false);
        strict_1.default.equal(result.testResults.length, 2);
        strict_1.default.deepEqual(executedCases, ['first', 'second']);
        strict_1.default.equal(result.testResults[0]?.success, true);
        strict_1.default.equal(result.testResults[1]?.success, false);
        strict_1.default.match(result.testResults[1]?.message ?? '', /gRPC client not connected/);
        strict_1.default.equal(cleanupCalls, 1);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests stops remaining tests after a terminal AI provider failure', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-terminal-provider-failure-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'first.yaml'), ['name: first', 'steps:', '  - Open first flow.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'second.yaml'), ['name: second', 'steps:', '  - Open second flow.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'third.yaml'), ['name: third', 'steps:', '  - Open third flow.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let cleanupCalls = 0;
    const executedCases = [];
    const terminalFailureMessage = 'AI provider error (openai/gpt-5.4-mini, HTTP 401): Unauthorized';
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({
        cleanup: async () => {
            cleanupCalls += 1;
        },
    });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async (_session, config) => {
        const testId = config.recording?.testId ?? 'unknown';
        executedCases.push(testId);
        if (testId === 'second') {
            return createTestExecutionResult({
                success: false,
                status: 'failure',
                message: terminalFailureMessage,
                terminalFailure: {
                    kind: 'provider',
                    provider: 'openai',
                    modelName: 'gpt-5.4-mini',
                    statusCode: 401,
                    message: terminalFailureMessage,
                },
            });
        }
        if (testId === 'third') {
            throw new Error('Third test should not execute after a terminal provider failure');
        }
        return createTestExecutionResult();
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['first.yaml', 'second.yaml', 'third.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, false);
        strict_1.default.equal(result.status, 'failure');
        strict_1.default.deepEqual(executedCases, ['first', 'second']);
        strict_1.default.equal(result.testResults.length, 2);
        strict_1.default.equal(result.testResults[1]?.status, 'failure');
        strict_1.default.match(result.testResults[1]?.message ?? '', /HTTP 401/);
        strict_1.default.equal(cleanupCalls, 1);
        const summary = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'summary.json'), 'utf-8'));
        strict_1.default.equal(summary.status, 'failure');
        strict_1.default.equal(summary.tests.length, 2);
        strict_1.default.equal(summary.tests[1]?.status, 'failure');
        const manifest = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'run.json'), 'utf-8'));
        strict_1.default.equal(manifest.run.status, 'failure');
        strict_1.default.equal(manifest.tests.length, 2);
        strict_1.default.equal(manifest.tests[1]?.status, 'failure');
        strict_1.default.match(manifest.run.firstFailure?.message ?? '', /HTTP 401/);
        const runnerLog = await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'runner.log'), 'utf-8');
        strict_1.default.match(runnerLog, /Stopping run after terminal AI provider failure/);
        strict_1.default.match(runnerLog, /AI provider error \(openai\/gpt-5.4-mini, HTTP 401\): Unauthorized/);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests aborts the batch after SIGINT and marks the active run as aborted', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-shared-session-abort-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'first.yaml'), ['name: first', 'steps:', '  - Open first flow.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'second.yaml'), ['name: second', 'steps:', '  - Open second flow.'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'third.yaml'), ['name: third', 'steps:', '  - Open third flow.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    const originalAddSigintListener = testRunner_js_1.testRunnerDependencies.addSigintListener;
    let cleanupCalls = 0;
    let sigintListener;
    const executedCases = [];
    testRunner_js_1.testRunnerDependencies.addSigintListener = (listener) => {
        sigintListener = listener;
        return () => {
            if (sigintListener === listener) {
                sigintListener = undefined;
            }
        };
    };
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession({
        cleanup: async () => {
            cleanupCalls += 1;
        },
    });
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async (_session, config) => {
        const testId = config.recording?.testId ?? 'unknown';
        executedCases.push(testId);
        if (testId === 'first') {
            strict_1.default.equal(typeof sigintListener, 'function');
            sigintListener?.();
            strict_1.default.equal(config.abortSignal?.aborted, true);
            return createTestExecutionResult({
                success: false,
                status: 'aborted',
                message: 'Goal execution was aborted',
                analysis: 'The run was aborted by the user.',
                totalIterations: 0,
                steps: [],
            });
        }
        return createTestExecutionResult();
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['first.yaml', 'second.yaml', 'third.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, false);
        strict_1.default.equal(result.status, 'aborted');
        strict_1.default.deepEqual(executedCases, ['first']);
        strict_1.default.equal(result.testResults.length, 1);
        strict_1.default.equal(result.testResults[0]?.status, 'aborted');
        strict_1.default.equal(cleanupCalls, 1);
        const summary = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'summary.json'), 'utf-8'));
        strict_1.default.equal(summary.status, 'aborted');
        strict_1.default.equal(summary.tests[0]?.status, 'aborted');
        const manifest = JSON.parse(await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'run.json'), 'utf-8'));
        strict_1.default.equal(manifest.run.status, 'aborted');
        strict_1.default.equal(manifest.input.tests.length, 3);
        strict_1.default.equal(manifest.tests.length, 1);
        strict_1.default.equal(manifest.tests[0]?.status, 'aborted');
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        testRunner_js_1.testRunnerDependencies.addSigintListener = originalAddSigintListener;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests requests a forced exit after a second SIGINT', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-shared-session-force-exit-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'first.yaml'), ['name: first', 'steps:', '  - Open first flow.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    const originalAddSigintListener = testRunner_js_1.testRunnerDependencies.addSigintListener;
    const originalExitProcess = testRunner_js_1.testRunnerDependencies.exitProcess;
    let sigintListener;
    let forcedExitCode;
    testRunner_js_1.testRunnerDependencies.addSigintListener = (listener) => {
        sigintListener = listener;
        return () => {
            if (sigintListener === listener) {
                sigintListener = undefined;
            }
        };
    };
    testRunner_js_1.testRunnerDependencies.exitProcess = ((code) => {
        forcedExitCode = code;
        return undefined;
    });
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => createTestSession();
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async () => {
        strict_1.default.equal(typeof sigintListener, 'function');
        sigintListener?.();
        sigintListener?.();
        return createTestExecutionResult({
            success: false,
            status: 'aborted',
            message: 'Goal execution was aborted',
            totalIterations: 0,
            steps: [],
        });
    };
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['first.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(forcedExitCode, 130);
        strict_1.default.equal(result.status, 'aborted');
        const runnerLog = await promises_1.default.readFile(node_path_1.default.join(result.runDir, 'runner.log'), 'utf-8');
        strict_1.default.match(runnerLog, /Received second SIGINT — forcing exit\./);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        testRunner_js_1.testRunnerDependencies.addSigintListener = originalAddSigintListener;
        testRunner_js_1.testRunnerDependencies.exitProcess = originalExitProcess;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests requires base app config even when the env file contains an app override', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-validation-failure-'));
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), ['app:', '  packageName: org.wikipedia'].join('\n'), 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    try {
        await strict_1.default.rejects(() => (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        }), (error) => {
            strict_1.default.ok(error instanceof testRunner_js_1.PreExecutionFailureError);
            strict_1.default.equal(error.phase, 'validation');
            strict_1.default.match(error.message, /\.usb-ui-test\/config\.yaml must define app\.packageName and\/or app\.bundleId/);
            return true;
        });
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests rejects validation failures before creating run artifacts', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-missing-selectors-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    try {
        await strict_1.default.rejects(() => (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        }), (error) => {
            strict_1.default.ok(error instanceof testRunner_js_1.PreExecutionFailureError);
            strict_1.default.equal(error.phase, 'validation');
            strict_1.default.match(error.message, /At least one test selector is required/);
            return true;
        });
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests surfaces device setup diagnostics before execution without creating run artifacts', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-setup-buffering-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => {
        common_1.Logger.i('Buffered setup log before runner.log exists');
        throw new sessionRunner_js_1.DevicePreparationError('No runnable devices or startable targets were found.', [
            {
                scope: 'android-connected',
                summary: 'Android device discovery failed.',
                blocking: true,
                transcripts: [
                    {
                        command: 'adb devices -l',
                        stdout: '',
                        stderr: 'adb executable missing',
                        exitCode: 1,
                    },
                ],
            },
        ]);
    };
    try {
        await strict_1.default.rejects(() => (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        }), (error) => {
            strict_1.default.ok(error instanceof testRunner_js_1.PreExecutionFailureError);
            strict_1.default.equal(error.phase, 'setup');
            strict_1.default.match(error.message, /Run setup failed before execution/);
            strict_1.default.match(error.message, /Command: adb devices -l/);
            strict_1.default.match(error.message, /stderr:\nadb executable missing/);
            return true;
        });
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests fails before prepareGoalSession when Android host preflight is blocked', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-android-preflight-failure-'));
    writeWorkspaceConfig(rootDir);
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    let prepareCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => {
        prepareCalls += 1;
        return createTestSession();
    };
    testRunner_js_1.testRunnerDependencies.runHostPreflight = async ({ requestedPlatforms }) => ({
        requestedPlatforms,
        checks: [
            {
                platform: 'android',
                status: 'error',
                id: 'adb',
                title: 'adb',
                summary: 'Required to communicate with Android devices.',
                detail: 'ADB was not found in ANDROID_HOME, ANDROID_SDK_ROOT, or PATH.',
                blocking: true,
            },
        ],
    });
    try {
        await strict_1.default.rejects(() => (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            platform: 'android',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        }), (error) => {
            strict_1.default.ok(error instanceof testRunner_js_1.PreExecutionFailureError);
            strict_1.default.equal(error.phase, 'setup');
            strict_1.default.match(error.message, /Local device setup is blocked for android\./i);
            strict_1.default.match(error.message, /usb-ui-test doctor --platform android/);
            return true;
        });
        strict_1.default.equal(prepareCalls, 0);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests fails before prepareGoalSession when iOS host preflight is blocked', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-ios-preflight-failure-'));
    writeWorkspaceConfig(rootDir, 'ios');
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    let prepareCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => {
        prepareCalls += 1;
        return createTestSession({ platform: 'ios' });
    };
    testRunner_js_1.testRunnerDependencies.runHostPreflight = async ({ requestedPlatforms }) => ({
        requestedPlatforms,
        checks: [
            {
                platform: 'ios',
                status: 'error',
                id: 'xcrun',
                title: 'xcrun',
                summary: 'Required to access iOS simulator tooling.',
                detail: 'xcrun was not found in PATH.',
                blocking: true,
            },
        ],
    });
    try {
        await strict_1.default.rejects(() => (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            platform: 'ios',
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        }), (error) => {
            strict_1.default.ok(error instanceof testRunner_js_1.PreExecutionFailureError);
            strict_1.default.equal(error.phase, 'setup');
            strict_1.default.match(error.message, /Local device setup is blocked for ios\./i);
            strict_1.default.match(error.message, /usb-ui-test doctor --platform ios/);
            return true;
        });
        strict_1.default.equal(prepareCalls, 0);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests continues when one platform is healthy and the other is blocked', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-preflight-partial-'));
    writeWorkspaceConfig(rootDir, 'ios');
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    const originalExecuteTestOnSession = testRunner_js_1.testRunnerDependencies.executeTestOnSession;
    let prepareCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => {
        prepareCalls += 1;
        return createTestSession({ platform: 'ios' });
    };
    testRunner_js_1.testRunnerDependencies.executeTestOnSession = async () => createTestExecutionResult({
        platform: 'ios',
    });
    testRunner_js_1.testRunnerDependencies.runHostPreflight = async ({ requestedPlatforms }) => ({
        requestedPlatforms,
        checks: [
            {
                platform: 'android',
                status: 'error',
                id: 'adb',
                title: 'adb',
                summary: 'Required to communicate with Android devices.',
                detail: 'ADB was not found in ANDROID_HOME, ANDROID_SDK_ROOT, or PATH.',
                blocking: true,
            },
            {
                platform: 'ios',
                status: 'ok',
                id: 'xcrun',
                title: 'xcrun',
                summary: 'Required to access iOS simulator tooling.',
                detail: '/usr/bin/xcrun',
                blocking: true,
            },
        ],
    });
    try {
        const result = await (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        });
        strict_1.default.equal(result.success, true);
        strict_1.default.equal(prepareCalls, 1);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        testRunner_js_1.testRunnerDependencies.executeTestOnSession = originalExecuteTestOnSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('runTests requires --platform when both Android and iOS apps are configured', async () => {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-preflight-both-blocked-'));
    writeWorkspaceConfig(rootDir, 'both');
    const testsDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'tests');
    const envDir = node_path_1.default.join(rootDir, '.usb-ui-test', 'env');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(envDir, 'dev.yaml'), '{}\n', 'utf-8');
    node_fs_1.default.writeFileSync(node_path_1.default.join(testsDir, 'login.yaml'), ['name: login', 'steps:', '  - Open the login screen.'].join('\n'), 'utf-8');
    const originalPrepareTestSession = testRunner_js_1.testRunnerDependencies.prepareTestSession;
    let prepareCalls = 0;
    testRunner_js_1.testRunnerDependencies.prepareTestSession = async () => {
        prepareCalls += 1;
        return createTestSession();
    };
    testRunner_js_1.testRunnerDependencies.runHostPreflight = async ({ requestedPlatforms }) => ({
        requestedPlatforms,
        checks: [
            {
                platform: 'android',
                status: 'error',
                id: 'adb',
                title: 'adb',
                summary: 'Required to communicate with Android devices.',
                detail: 'ADB was not found in ANDROID_HOME, ANDROID_SDK_ROOT, or PATH.',
                blocking: true,
            },
            {
                platform: 'ios',
                status: 'error',
                id: 'xcrun',
                title: 'xcrun',
                summary: 'Required to access iOS simulator tooling.',
                detail: 'xcrun was not found in PATH.',
                blocking: true,
            },
        ],
    });
    try {
        await strict_1.default.rejects(() => (0, testRunner_js_1.runTests)({
            envName: 'dev',
            cwd: rootDir,
            selectors: ['login.yaml'],
            apiKeys: { openai: 'test-key' },
            defaults: { provider: 'openai', modelName: 'gpt-5.4-mini' },
        }), (error) => {
            strict_1.default.ok(error instanceof testRunner_js_1.PreExecutionFailureError);
            strict_1.default.equal(error.phase, 'validation');
            strict_1.default.match(error.message, /Both Android and iOS app identifiers are configured\. Pass --platform android or --platform ios\./);
            return true;
        });
        strict_1.default.equal(prepareCalls, 0);
        await assertNoRunArtifacts(rootDir);
    }
    finally {
        testRunner_js_1.testRunnerDependencies.prepareTestSession = originalPrepareTestSession;
        await promises_1.default.rm(rootDir, { recursive: true, force: true });
    }
});
//# sourceMappingURL=testRunner.test.js.map