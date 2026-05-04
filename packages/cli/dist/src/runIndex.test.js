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
const runIndex_js_1 = require("./runIndex.js");
function createRunManifest(runId, success, target = { type: 'direct' }) {
    return {
        schemaVersion: 2,
        run: {
            runId,
            success,
            status: success ? 'success' : 'failure',
            startedAt: '2026-03-23T18:00:00.000Z',
            completedAt: '2026-03-23T18:00:10.000Z',
            durationMs: 10000,
            envName: 'dev',
            platform: 'android',
            model: {
                provider: 'openai',
                modelName: 'gpt-5.4-mini',
                label: 'openai/gpt-5.4-mini',
            },
            app: {
                source: 'repo',
                label: 'repo app',
            },
            selectors: ['login.yaml'],
            target,
            counts: {
                tests: {
                    total: 1,
                    passed: success ? 1 : 0,
                    failed: success ? 0 : 1,
                },
                steps: {
                    total: 1,
                    passed: success ? 1 : 0,
                    failed: success ? 0 : 1,
                },
            },
            firstFailure: success
                ? undefined
                : {
                    testId: 'login',
                    testName: 'login',
                    message: 'button not found',
                    screenshotPath: 'tests/login/screenshots/001.jpg',
                },
        },
        input: {
            environment: {
                envName: 'dev',
                variables: {},
                secretReferences: [],
            },
            tests: [],
            cli: {
                command: 'usb-ui-test test',
                selectors: ['login.yaml'],
                debug: false,
            },
        },
        tests: [],
        paths: {
            runJson: 'run.json',
            summaryJson: 'summary.json',
            log: 'runner.log',
        },
    };
}
(0, node_test_1.default)('rebuildRunIndex writes runs.json from run.json files', async () => {
    const artifactsDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-run-index-'));
    const runId = '2026-03-23T18-00-00.000Z-dev-android';
    const runDir = node_path_1.default.join(artifactsDir, runId);
    await promises_1.default.mkdir(runDir, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(runDir, 'run.json'), JSON.stringify(createRunManifest(runId, false), null, 2), 'utf-8');
    try {
        const index = await (0, runIndex_js_1.rebuildRunIndex)(artifactsDir);
        strict_1.default.equal(index.runs.length, 1);
        strict_1.default.equal(index.runs[0]?.runId, runId);
        const runsJsonPath = node_path_1.default.join(artifactsDir, 'runs.json');
        const stats = await promises_1.default.stat(runsJsonPath);
        strict_1.default.equal(stats.isFile(), true);
        const runsJson = JSON.parse(await promises_1.default.readFile(runsJsonPath, 'utf-8'));
        strict_1.default.equal(runsJson.runs[0]?.firstFailure?.message, 'button not found');
        strict_1.default.equal(runsJson.runs[0]?.paths.runJson, `${runId}/run.json`);
    }
    finally {
        await promises_1.default.rm(artifactsDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('rebuildRunIndex carries compact suite target metadata into runs.json', async () => {
    const artifactsDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-suite-run-index-'));
    const runId = '2026-03-24T08-10-11.000Z-dev-android';
    const runDir = node_path_1.default.join(artifactsDir, runId);
    await promises_1.default.mkdir(runDir, { recursive: true });
    await promises_1.default.writeFile(node_path_1.default.join(runDir, 'run.json'), JSON.stringify(createRunManifest(runId, true, {
        type: 'suite',
        suiteId: 'login_suite',
        suiteName: 'login suite',
        suitePath: 'login_suite.yaml',
    }), null, 2), 'utf-8');
    try {
        const index = await (0, runIndex_js_1.rebuildRunIndex)(artifactsDir);
        strict_1.default.deepEqual(index.runs[0]?.target, {
            type: 'suite',
            suiteId: 'login_suite',
            suiteName: 'login suite',
            suitePath: 'login_suite.yaml',
        });
    }
    finally {
        await promises_1.default.rm(artifactsDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('formatRunIndexForConsole prints ABORT for aborted runs', () => {
    const output = (0, runIndex_js_1.formatRunIndexForConsole)({
        schemaVersion: 1,
        generatedAt: '2026-03-23T18:00:00.000Z',
        runs: [
            {
                runId: '2026-03-23T18-00-00.000Z-dev-android',
                success: false,
                status: 'aborted',
                startedAt: '2026-03-23T18:00:00.000Z',
                completedAt: '2026-03-23T18:00:10.000Z',
                durationMs: 10000,
                envName: 'dev',
                platform: 'android',
                modelLabel: 'openai/gpt-5.4-mini',
                appLabel: 'repo app',
                testCount: 2,
                passedCount: 0,
                failedCount: 1,
                stepCount: 1,
                paths: {
                    runJson: '2026-03-23T18-00-00.000Z-dev-android/run.json',
                    log: '2026-03-23T18-00-00.000Z-dev-android/runner.log',
                },
            },
        ],
    });
    strict_1.default.match(output, /^Status {2}Env/m);
    strict_1.default.match(output, /ABORT/);
});
//# sourceMappingURL=runIndex.test.js.map