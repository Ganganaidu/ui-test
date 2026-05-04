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
const reportServerManager_js_1 = require("./reportServerManager.js");
function createWorkspace() {
    const rootDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-report-manager-'));
    const usbUiTestDir = node_path_1.default.join(rootDir, '.usb-ui-test');
    const testsDir = node_path_1.default.join(usbUiTestDir, 'tests');
    const suitesDir = node_path_1.default.join(usbUiTestDir, 'suites');
    const envDir = node_path_1.default.join(usbUiTestDir, 'env');
    const artifactsDir = node_path_1.default.join(rootDir, '.artifacts-home', '.usb-ui-test', 'workspaces', 'workspace-hash', 'artifacts');
    node_fs_1.default.mkdirSync(testsDir, { recursive: true });
    node_fs_1.default.mkdirSync(suitesDir, { recursive: true });
    node_fs_1.default.mkdirSync(envDir, { recursive: true });
    node_fs_1.default.mkdirSync(artifactsDir, { recursive: true });
    return {
        rootDir,
        usbUiTestDir,
        testsDir,
        suitesDir,
        envDir,
        artifactsDir,
    };
}
function createServerState(workspace) {
    return {
        pid: 4321,
        port: 4173,
        url: 'http://127.0.0.1:4173',
        workspaceRoot: workspace.rootDir,
        artifactsDir: workspace.artifactsDir,
        mode: 'production',
        startedAt: '2026-03-24T18:00:00.000Z',
    };
}
function createSpawnedChild(pid) {
    return {
        pid,
        unref() { },
    };
}
function createSuccessfulCommandResult() {
    return {
        status: 0,
        pid: 7331,
        output: ['', '', ''],
        stdout: '',
        stderr: '',
        signal: null,
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
(0, node_test_1.default)('resolveHealthyWorkspaceReportServer returns the persisted state for a healthy workspace server', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => ({
            status: 200,
            body: {
                status: 'ok',
                workspaceRoot: workspace.rootDir,
                artifactsDir: workspace.artifactsDir,
            },
        });
        const state = await (0, reportServerManager_js_1.resolveHealthyWorkspaceReportServer)(workspace);
        strict_1.default.equal(state?.url, 'http://127.0.0.1:4173');
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('resolveHealthyWorkspaceReportServer clears stale state when the health check fails', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => {
            throw new Error('connection refused');
        };
        const state = await (0, reportServerManager_js_1.resolveHealthyWorkspaceReportServer)(workspace);
        strict_1.default.equal(state, undefined);
        const persistedState = await (0, reportServerManager_js_1.readWorkspaceReportServerState)(workspace);
        strict_1.default.equal(persistedState, undefined);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('startOrReuseWorkspaceReportServer reuses an already healthy server without spawning a new one', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    const originalSpawnProcess = reportServerManager_js_1.reportServerManagerDependencies.spawnProcess;
    let spawnCalls = 0;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => ({
            status: 200,
            body: {
                status: 'ok',
                workspaceRoot: workspace.rootDir,
                artifactsDir: workspace.artifactsDir,
            },
        });
        reportServerManager_js_1.reportServerManagerDependencies.spawnProcess = () => {
            spawnCalls += 1;
            return createSpawnedChild(9001);
        };
        const result = await (0, reportServerManager_js_1.startOrReuseWorkspaceReportServer)({
            workspace,
            requestedPort: 4173,
        });
        strict_1.default.equal(result.reused, true);
        strict_1.default.equal(result.url, 'http://127.0.0.1:4173');
        strict_1.default.equal(spawnCalls, 0);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        reportServerManager_js_1.reportServerManagerDependencies.spawnProcess = originalSpawnProcess;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('startOrReuseWorkspaceReportServer starts a new server, waits for health, and persists .server.json', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    const originalSpawnProcess = reportServerManager_js_1.reportServerManagerDependencies.spawnProcess;
    const originalSleep = reportServerManager_js_1.reportServerManagerDependencies.sleep;
    let healthChecks = 0;
    let spawnArgs = [];
    const requestedPort = await findAvailablePort();
    try {
        reportServerManager_js_1.reportServerManagerDependencies.spawnProcess = (_command, args) => {
            spawnArgs = args;
            return createSpawnedChild(7331);
        };
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => {
            healthChecks += 1;
            if (healthChecks < 2) {
                throw new Error('booting');
            }
            return {
                status: 200,
                body: {
                    status: 'ok',
                    workspaceRoot: workspace.rootDir,
                    artifactsDir: workspace.artifactsDir,
                },
            };
        };
        reportServerManager_js_1.reportServerManagerDependencies.sleep = async () => { };
        const result = await (0, reportServerManager_js_1.startOrReuseWorkspaceReportServer)({
            workspace,
            requestedPort,
        });
        strict_1.default.equal(result.reused, false);
        strict_1.default.equal(result.state.pid, 7331);
        strict_1.default.equal(result.state.port, requestedPort);
        strict_1.default.equal(result.url, `http://127.0.0.1:${requestedPort}`);
        strict_1.default.match(spawnArgs.join(' '), /internal-report-server/);
        const persisted = await (0, reportServerManager_js_1.readWorkspaceReportServerState)(workspace);
        strict_1.default.equal(persisted?.port, requestedPort);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        reportServerManager_js_1.reportServerManagerDependencies.spawnProcess = originalSpawnProcess;
        reportServerManager_js_1.reportServerManagerDependencies.sleep = originalSleep;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('getWorkspaceReportServerStatus returns live running details and prefers the health-check pid', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => ({
            status: 200,
            body: {
                status: 'ok',
                workspaceRoot: workspace.rootDir,
                artifactsDir: workspace.artifactsDir,
                pid: 9001,
            },
        });
        const status = await (0, reportServerManager_js_1.getWorkspaceReportServerStatus)(workspace);
        strict_1.default.equal(status.running, true);
        strict_1.default.equal(status.healthy, true);
        strict_1.default.equal(status.state?.pid, 9001);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('stopWorkspaceReportServer stops a healthy workspace server and removes stale state', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    const originalKillProcess = reportServerManager_js_1.reportServerManagerDependencies.killProcess;
    const originalSleep = reportServerManager_js_1.reportServerManagerDependencies.sleep;
    let healthChecks = 0;
    let killedPid = 0;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => {
            healthChecks += 1;
            if (healthChecks === 1) {
                return {
                    status: 200,
                    body: {
                        status: 'ok',
                        workspaceRoot: workspace.rootDir,
                        artifactsDir: workspace.artifactsDir,
                        pid: 7777,
                    },
                };
            }
            throw new Error('connection refused');
        };
        reportServerManager_js_1.reportServerManagerDependencies.killProcess = (pid) => {
            killedPid = pid;
        };
        reportServerManager_js_1.reportServerManagerDependencies.sleep = async () => { };
        const result = await (0, reportServerManager_js_1.stopWorkspaceReportServer)(workspace);
        strict_1.default.equal(result.stopped, true);
        strict_1.default.equal(killedPid, 7777);
        strict_1.default.equal(await (0, reportServerManager_js_1.readWorkspaceReportServerState)(workspace), undefined);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        reportServerManager_js_1.reportServerManagerDependencies.killProcess = originalKillProcess;
        reportServerManager_js_1.reportServerManagerDependencies.sleep = originalSleep;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('stopWorkspaceReportServer refuses to kill a healthy server that does not report a live pid', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    const originalKillProcess = reportServerManager_js_1.reportServerManagerDependencies.killProcess;
    let killCalls = 0;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => ({
            status: 200,
            body: {
                status: 'ok',
                workspaceRoot: workspace.rootDir,
                artifactsDir: workspace.artifactsDir,
            },
        });
        reportServerManager_js_1.reportServerManagerDependencies.killProcess = () => {
            killCalls += 1;
        };
        await strict_1.default.rejects(() => (0, reportServerManager_js_1.stopWorkspaceReportServer)(workspace), /live server did not report a pid/);
        strict_1.default.equal(killCalls, 0);
        strict_1.default.notEqual(await (0, reportServerManager_js_1.readWorkspaceReportServerState)(workspace), undefined);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        reportServerManager_js_1.reportServerManagerDependencies.killProcess = originalKillProcess;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('stopWorkspaceReportServer is idempotent when the server is already down', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async () => {
            throw new Error('connection refused');
        };
        const result = await (0, reportServerManager_js_1.stopWorkspaceReportServer)(workspace);
        strict_1.default.equal(result.stopped, false);
        strict_1.default.equal(result.staleStateCleared, true);
        strict_1.default.equal(await (0, reportServerManager_js_1.readWorkspaceReportServerState)(workspace), undefined);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('getWorkspaceReportServerStatus treats a timed-out health probe as stale state', async () => {
    const workspace = createWorkspace();
    const originalFetchJson = reportServerManager_js_1.reportServerManagerDependencies.fetchJson;
    const originalHealthProbeTimeoutMs = reportServerManager_js_1.reportServerManagerDependencies.healthProbeTimeoutMs;
    try {
        await (0, reportServerManager_js_1.writeWorkspaceReportServerState)(workspace, createServerState(workspace));
        reportServerManager_js_1.reportServerManagerDependencies.healthProbeTimeoutMs = 10;
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = async (_url, signal) => {
            await new Promise((_resolve, reject) => {
                signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
            });
            throw new Error('unreachable');
        };
        const status = await (0, reportServerManager_js_1.getWorkspaceReportServerStatus)(workspace);
        strict_1.default.equal(status.running, false);
        strict_1.default.equal(status.staleStateCleared, true);
        strict_1.default.equal(await (0, reportServerManager_js_1.readWorkspaceReportServerState)(workspace), undefined);
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.fetchJson = originalFetchJson;
        reportServerManager_js_1.reportServerManagerDependencies.healthProbeTimeoutMs = originalHealthProbeTimeoutMs;
        await promises_1.default.rm(workspace.rootDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('openReportUrl delegates to the browser opener and buildRunReportUrl targets the run route', async () => {
    const originalOpenBrowser = reportServerManager_js_1.reportServerManagerDependencies.openBrowser;
    let openedUrl = '';
    try {
        reportServerManager_js_1.reportServerManagerDependencies.openBrowser = async (url) => {
            openedUrl = url;
        };
        const runUrl = (0, reportServerManager_js_1.buildRunReportUrl)('http://127.0.0.1:4173', '2026-03-24T18-00-00.000Z-dev-android');
        await (0, reportServerManager_js_1.openReportUrl)(runUrl);
        strict_1.default.equal(openedUrl, 'http://127.0.0.1:4173/runs/2026-03-24T18-00-00.000Z-dev-android');
    }
    finally {
        reportServerManager_js_1.reportServerManagerDependencies.openBrowser = originalOpenBrowser;
    }
});
//# sourceMappingURL=reportServerManager.test.js.map