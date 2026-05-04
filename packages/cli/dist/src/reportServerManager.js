"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportServerManagerDependencies = void 0;
exports.startOrReuseWorkspaceReportServer = startOrReuseWorkspaceReportServer;
exports.resolveHealthyWorkspaceReportServer = resolveHealthyWorkspaceReportServer;
exports.getWorkspaceReportServerStatus = getWorkspaceReportServerStatus;
exports.stopWorkspaceReportServer = stopWorkspaceReportServer;
exports.openReportUrl = openReportUrl;
exports.buildWorkspaceReportUrl = buildWorkspaceReportUrl;
exports.buildRunReportUrl = buildRunReportUrl;
exports.readWorkspaceReportServerState = readWorkspaceReportServerState;
exports.writeWorkspaceReportServerState = writeWorkspaceReportServerState;
exports.clearWorkspaceReportServerState = clearWorkspaceReportServerState;
exports.getWorkspaceReportServerStatePath = getWorkspaceReportServerStatePath;
const fsp = __importStar(require("node:fs/promises"));
const net = __importStar(require("node:net"));
const path = __importStar(require("node:path"));
const node_child_process_1 = require("node:child_process");
const runtimePaths_js_1 = require("./runtimePaths.js");
const DEFAULT_REPORT_SERVER_PORT = 4173;
const HEALTH_ROUTE = '/health';
const DEFAULT_HEALTH_PROBE_TIMEOUT_MS = 2000;
exports.reportServerManagerDependencies = {
    healthProbeTimeoutMs: DEFAULT_HEALTH_PROBE_TIMEOUT_MS,
    spawnProcess(command, args, options) {
        return (0, node_child_process_1.spawn)(command, args, options);
    },
    async fetchJson(url, signal) {
        const response = await fetch(url, {
            headers: {
                accept: 'application/json',
            },
            signal,
        });
        let body = undefined;
        try {
            body = await response.json();
        }
        catch {
            body = undefined;
        }
        return {
            status: response.status,
            body,
        };
    },
    async openBrowser(url) {
        if (process.env.USB_UI_TEST_DISABLE_BROWSER === '1') {
            return;
        }
        const platform = process.platform;
        if (platform === 'darwin') {
            const result = (0, node_child_process_1.spawnSync)('open', [url], { stdio: 'ignore' });
            if (result.status !== 0) {
                throw new Error(`Failed to open browser for ${url}`);
            }
            return;
        }
        if (platform === 'win32') {
            const result = (0, node_child_process_1.spawnSync)('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
            if (result.status !== 0) {
                throw new Error(`Failed to open browser for ${url}`);
            }
            return;
        }
        const result = (0, node_child_process_1.spawnSync)('xdg-open', [url], { stdio: 'ignore' });
        if (result.status !== 0) {
            throw new Error(`Failed to open browser for ${url}`);
        }
    },
    async sleep(ms) {
        await new Promise((resolve) => setTimeout(resolve, ms));
    },
    killProcess(pid, signal) {
        process.kill(pid, signal);
    },
    isProcessAlive(pid) {
        try {
            process.kill(pid, 0);
            return true;
        }
        catch (error) {
            if (isNodeErrorWithCode(error) && error.code === 'ESRCH') {
                return false;
            }
            return true;
        }
    },
};
async function startOrReuseWorkspaceReportServer(options) {
    const existing = await resolveHealthyWorkspaceReportServer(options.workspace);
    if (existing) {
        return {
            state: existing,
            url: existing.url,
            reused: true,
        };
    }
    const port = await findAvailablePort(options.requestedPort ?? DEFAULT_REPORT_SERVER_PORT);
    const mode = options.dev ? 'development' : 'production';
    const child = startReportWebProcess({
        workspace: options.workspace,
        port,
        mode,
    });
    const url = `http://127.0.0.1:${port}`;
    await waitForHealthyWorkspaceReportServer({
        workspace: options.workspace,
        url,
    });
    const state = {
        pid: child.pid ?? 0,
        port,
        url,
        workspaceRoot: options.workspace.rootDir,
        artifactsDir: options.workspace.artifactsDir,
        mode,
        startedAt: new Date().toISOString(),
    };
    await writeWorkspaceReportServerState(options.workspace, state);
    return {
        state,
        url,
        reused: false,
    };
}
async function resolveHealthyWorkspaceReportServer(workspace) {
    const state = await readWorkspaceReportServerState(workspace);
    if (!state) {
        return undefined;
    }
    const health = await probeWorkspaceReportServerHealth(state, workspace);
    if (health.healthy) {
        return {
            ...state,
            pid: health.livePid ?? state.pid,
        };
    }
    await clearWorkspaceReportServerState(workspace);
    return undefined;
}
async function getWorkspaceReportServerStatus(workspace) {
    const state = await readWorkspaceReportServerState(workspace);
    if (!state) {
        return {
            running: false,
            healthy: false,
            staleStateCleared: false,
        };
    }
    const health = await probeWorkspaceReportServerHealth(state, workspace);
    if (!health.healthy) {
        await clearWorkspaceReportServerState(workspace);
        return {
            running: false,
            healthy: false,
            staleStateCleared: true,
        };
    }
    return {
        running: true,
        healthy: true,
        staleStateCleared: false,
        livePid: health.livePid,
        state: {
            ...state,
            pid: health.livePid ?? state.pid,
        },
    };
}
async function stopWorkspaceReportServer(workspace) {
    const status = await getWorkspaceReportServerStatus(workspace);
    if (!status.running || !status.state) {
        return {
            stopped: false,
            staleStateCleared: status.staleStateCleared,
        };
    }
    let livePid = status.livePid;
    if (livePid === undefined) {
        const health = await probeWorkspaceReportServerHealth(status.state, workspace);
        if (!health.healthy) {
            await clearWorkspaceReportServerState(workspace);
            return {
                stopped: false,
                staleStateCleared: true,
            };
        }
        livePid = health.livePid;
    }
    if (livePid === undefined) {
        throw new Error(`Could not safely stop the UsbUiTest report server for ${workspace.rootDir} because the live server did not report a pid.`);
    }
    const pid = livePid;
    if (!Number.isInteger(pid) || pid <= 0) {
        throw new Error(`Healthy UsbUiTest report server did not report a valid pid for ${workspace.rootDir}.`);
    }
    const stopState = {
        ...status.state,
        pid,
    };
    try {
        exports.reportServerManagerDependencies.killProcess(pid, 'SIGTERM');
    }
    catch (error) {
        if (!isNodeErrorWithCode(error) || error.code !== 'ESRCH') {
            throw error;
        }
    }
    await waitForWorkspaceReportServerShutdown({
        workspace,
        state: stopState,
    });
    await clearWorkspaceReportServerState(workspace);
    return {
        stopped: true,
        staleStateCleared: false,
        state: stopState,
    };
}
async function openReportUrl(url) {
    await exports.reportServerManagerDependencies.openBrowser(url);
}
function buildWorkspaceReportUrl(serverUrl) {
    return serverUrl;
}
function buildRunReportUrl(serverUrl, runId) {
    return `${serverUrl.replace(/\/+$/, '')}/runs/${encodeURIComponent(runId)}`;
}
async function readWorkspaceReportServerState(workspace) {
    try {
        const raw = await fsp.readFile(getWorkspaceReportServerStatePath(workspace), 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return undefined;
    }
}
async function writeWorkspaceReportServerState(workspace, state) {
    await fsp.mkdir(workspace.artifactsDir, { recursive: true });
    await fsp.writeFile(getWorkspaceReportServerStatePath(workspace), JSON.stringify(state, null, 2), 'utf-8');
}
async function clearWorkspaceReportServerState(workspace) {
    await fsp.rm(getWorkspaceReportServerStatePath(workspace), { force: true });
}
function getWorkspaceReportServerStatePath(workspace) {
    return path.join(workspace.artifactsDir, '.server.json');
}
async function isHealthyWorkspaceReportServer(state, workspace) {
    return (await probeWorkspaceReportServerHealth(state, workspace)).healthy;
}
async function waitForHealthyWorkspaceReportServer(params) {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        const state = {
            pid: 0,
            port: new URL(params.url).port
                ? parseInt(new URL(params.url).port, 10)
                : DEFAULT_REPORT_SERVER_PORT,
            url: params.url,
            workspaceRoot: params.workspace.rootDir,
            artifactsDir: params.workspace.artifactsDir,
            mode: 'production',
            startedAt: new Date().toISOString(),
        };
        if (await isHealthyWorkspaceReportServer(state, params.workspace)) {
            return;
        }
        await exports.reportServerManagerDependencies.sleep(250);
    }
    throw new Error('Timed out waiting for the UsbUiTest report server to become healthy.');
}
async function waitForWorkspaceReportServerShutdown(params) {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        const health = await probeWorkspaceReportServerHealth(params.state, params.workspace);
        if (!health.healthy) {
            return;
        }
        if (!exports.reportServerManagerDependencies.isProcessAlive(params.state.pid)) {
            return;
        }
        await exports.reportServerManagerDependencies.sleep(250);
    }
    throw new Error('Timed out waiting for the UsbUiTest report server to stop.');
}
async function probeWorkspaceReportServerHealth(state, workspace) {
    try {
        const health = await fetchWorkspaceReportServerHealth(`${state.url}${HEALTH_ROUTE}`);
        if (health.status !== 200) {
            return { healthy: false };
        }
        const body = isReportHealthPayload(health.body) ? health.body : undefined;
        if (!body) {
            return { healthy: false };
        }
        const livePid = typeof body.pid === 'number' && Number.isInteger(body.pid) && body.pid > 0
            ? body.pid
            : undefined;
        return {
            healthy: body.status === 'ok' &&
                body.workspaceRoot === workspace.rootDir &&
                body.artifactsDir === workspace.artifactsDir,
            livePid,
        };
    }
    catch {
        return { healthy: false };
    }
}
async function fetchWorkspaceReportServerHealth(url) {
    const controller = new AbortController();
    const timeoutMs = Math.max(1, exports.reportServerManagerDependencies.healthProbeTimeoutMs);
    let timeoutId;
    try {
        return await Promise.race([
            exports.reportServerManagerDependencies.fetchJson(url, controller.signal),
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    controller.abort();
                    reject(new Error('Health probe timed out.'));
                }, timeoutMs);
            }),
        ]);
    }
    finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
    }
}
function startReportWebProcess(params) {
    const args = (0, runtimePaths_js_1.resolveCliLaunchArgs)([
        'internal-report-server',
        '--workspace-root',
        params.workspace.rootDir,
        '--artifacts-dir',
        params.workspace.artifactsDir,
        '--port',
        String(params.port),
        '--mode',
        params.mode,
    ]);
    const child = exports.reportServerManagerDependencies.spawnProcess(process.execPath, args, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
        env: process.env,
    });
    child.unref();
    return child;
}
async function findAvailablePort(startingPort) {
    if (startingPort === 0) {
        return await getEphemeralPort();
    }
    let candidate = Math.max(0, startingPort);
    while (candidate < startingPort + 20) {
        if (await isPortAvailable(candidate)) {
            return candidate;
        }
        candidate += 1;
    }
    throw new Error(`Could not find an open port near ${startingPort}.`);
}
async function isPortAvailable(port) {
    return await new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.listen(port, '127.0.0.1', () => {
            server.close(() => resolve(true));
        });
    });
}
function isReportHealthPayload(value) {
    return typeof value === 'object' && value !== null;
}
function isNodeErrorWithCode(error) {
    return error instanceof Error && 'code' in error;
}
async function getEphemeralPort() {
    return await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (!address || typeof address === 'string') {
                server.close(() => reject(new Error('Failed to allocate an ephemeral port.')));
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
//# sourceMappingURL=reportServerManager.js.map