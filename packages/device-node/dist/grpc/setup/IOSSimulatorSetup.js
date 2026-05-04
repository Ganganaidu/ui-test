"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOSSimulatorSetup = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const common_1 = require("@usb-ui-test/common");
const ScreenshotCaptureCoordinator_js_1 = require("../../capture/ScreenshotCaptureCoordinator.js");
const SimctlClient_js_1 = require("../../infra/ios/SimctlClient.js");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
class IOSSimulatorSetup {
    _simctlClient;
    _filePathUtil;
    _connectWithPolling;
    _captureReadinessTimeoutMs;
    _captureReadinessDelayMs;
    _killStaleHostProcessesOnPortFn;
    constructor(params) {
        this._simctlClient = params.simctlClient;
        this._filePathUtil = params.filePathUtil;
        this._connectWithPolling = params.connectWithPolling;
        this._captureReadinessTimeoutMs = params.captureReadinessTimeoutMs;
        this._captureReadinessDelayMs = params.captureReadinessDelayMs;
        this._killStaleHostProcessesOnPortFn =
            params.killStaleHostProcessesOnPortFn ??
                (async (port) => await this._killStaleHostProcessesOnPort(port));
    }
    async prepare(deviceInfo, grpcClient) {
        const deviceId = deviceInfo.id;
        if (!deviceId) {
            throw new Error('iOS simulator ID is required for driver setup.');
        }
        let driverStarted = false;
        try {
            await this._filePathUtil.ensureIOSAppsAvailable();
            const driverPath = await this._filePathUtil.getIOSDriverAppPath();
            if (!driverPath) {
                throw new Error('iOS driver app not found.');
            }
            common_1.Logger.i(`Installing iOS driver app on ${deviceId}...`);
            const installed = await this._simctlClient.installApp(deviceId, driverPath);
            if (!installed) {
                throw new Error(`Failed to install iOS driver app: ${driverPath}`);
            }
            await this._killStaleHostProcessesOnPortFn(common_1.DEFAULT_GRPC_PORT_START);
            common_1.Logger.i(`Terminating existing iOS driver app on ${deviceId}...`);
            await this._simctlClient.terminateApp(deviceId, SimctlClient_js_1.IOS_DRIVER_RUNNER_BUNDLE_ID);
            common_1.Logger.i('Starting iOS driver app...');
            const driverProcess = this._simctlClient.startDriver(deviceId, common_1.DEFAULT_GRPC_PORT_START);
            driverStarted = true;
            const startupState = this._trackIOSDriverProcess(deviceId, driverProcess);
            common_1.Logger.i(`Waiting for iOS driver gRPC at 127.0.0.1:${common_1.DEFAULT_GRPC_PORT_START}...`);
            const connected = await this._connectWithPolling(grpcClient, '127.0.0.1', common_1.DEFAULT_GRPC_PORT_START, {
                getStartupFailureMessage: () => startupState.failureMessage,
                getWaitStatusMessage: () => this._formatWaitStatus(startupState),
            });
            if (!connected) {
                throw new Error('Failed to connect to iOS simulator via gRPC after 120s - driver did not start');
            }
            const captureReady = await (0, ScreenshotCaptureCoordinator_js_1.waitForDriverCaptureReadiness)(grpcClient, {
                timeoutMs: this._captureReadinessTimeoutMs,
                delayMs: this._captureReadinessDelayMs,
            });
            if (!captureReady.ready) {
                if (startupState.failureMessage) {
                    throw new Error(startupState.failureMessage);
                }
                throw new Error(`iOS driver started and gRPC connected, but screenshot capture never became ready after ${this._captureReadinessTimeoutMs / 1000}s: ${captureReady.message ?? 'unknown capture readiness error'}`);
            }
            if (startupState.failureMessage) {
                throw new Error(startupState.failureMessage);
            }
            await this._updateIOSAppIds(deviceId, grpcClient, { throwOnFailure: true });
            startupState.setupComplete = true;
            common_1.Logger.i('iOS gRPC connection established successfully');
            // Restart callback — runs the full post-install setup sequence
            // (same steps as initial setup: kill stale, terminate, start, connect, capture readiness, app IDs)
            const restartDriver = async () => {
                common_1.Logger.i(`IOSSimulatorSetup: Restarting driver for ${deviceId}...`);
                await this._killStaleHostProcessesOnPortFn(common_1.DEFAULT_GRPC_PORT_START);
                try {
                    await this._simctlClient.terminateApp(deviceId, SimctlClient_js_1.IOS_DRIVER_RUNNER_BUNDLE_ID);
                }
                catch {
                    // May already be dead
                }
                grpcClient.close();
                const newProcess = this._simctlClient.startDriver(deviceId, common_1.DEFAULT_GRPC_PORT_START);
                const newStartupState = this._trackIOSDriverProcess(deviceId, newProcess);
                const connected = await this._connectWithPolling(grpcClient, '127.0.0.1', common_1.DEFAULT_GRPC_PORT_START, {
                    getStartupFailureMessage: () => newStartupState.failureMessage,
                    getWaitStatusMessage: () => this._formatWaitStatus(newStartupState),
                });
                if (!connected) {
                    throw new Error('Failed to reconnect to iOS driver via gRPC after restart');
                }
                const captureReady = await (0, ScreenshotCaptureCoordinator_js_1.waitForDriverCaptureReadiness)(grpcClient, {
                    timeoutMs: this._captureReadinessTimeoutMs,
                    delayMs: this._captureReadinessDelayMs,
                });
                if (!captureReady.ready) {
                    throw new Error(`iOS driver restarted but capture readiness failed: ${captureReady.message ?? 'unknown'}`);
                }
                await this._updateIOSAppIds(deviceId, grpcClient, { throwOnFailure: true });
                newStartupState.setupComplete = true;
                common_1.Logger.i(`IOSSimulatorSetup: Driver restarted successfully for ${deviceId}`);
                return newProcess;
            };
            return { deviceId, grpcPort: common_1.DEFAULT_GRPC_PORT_START, driverProcess, restartDriver };
        }
        catch (error) {
            if (driverStarted) {
                try {
                    await this._simctlClient.terminateApp(deviceId, SimctlClient_js_1.IOS_DRIVER_RUNNER_BUNDLE_ID);
                }
                catch (cleanupError) {
                    common_1.Logger.w(`Failed to terminate iOS driver app during rollback for ${deviceId}:`, cleanupError);
                }
            }
            throw error;
        }
    }
    _trackIOSDriverProcess(deviceId, driverProcess) {
        const state = {
            setupComplete: false,
            failureMessage: null,
            recentLogs: [],
        };
        const appendLog = (source, chunk) => {
            const text = chunk.toString().trim();
            if (!text) {
                return;
            }
            for (const line of text.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed) {
                    continue;
                }
                common_1.Logger.d(`iOS driver ${source}: ${trimmed}`);
                state.recentLogs.push(`${source}: ${trimmed}`);
                if (state.recentLogs.length > 20) {
                    state.recentLogs.shift();
                }
            }
        };
        driverProcess.stdout?.on('data', (chunk) => appendLog('stdout', chunk));
        driverProcess.stderr?.on('data', (chunk) => appendLog('stderr', chunk));
        driverProcess.on('error', (error) => {
            state.failureMessage = `iOS driver process error for ${deviceId}: ${error.message}`;
            common_1.Logger.e(state.failureMessage);
        });
        driverProcess.on('exit', (code, signal) => {
            const exitDescription = code !== null ? `code ${code}` : signal ? `signal ${signal}` : 'unknown status';
            const logSuffix = state.recentLogs.length > 0 ? ` Logs: ${state.recentLogs.join(' | ')}` : '';
            if (!state.setupComplete) {
                state.failureMessage =
                    `iOS driver process exited before setup completed (${exitDescription}) for ${deviceId}.${logSuffix}`;
                common_1.Logger.e(state.failureMessage);
            }
            else {
                common_1.Logger.i(`iOS driver process ended for ${deviceId} (${exitDescription})`);
            }
        });
        return state;
    }
    async _killStaleHostProcessesOnPort(port) {
        try {
            const { stdout } = await execFileAsync('lsof', ['-ti', `:${port}`]);
            const pids = stdout
                .toString()
                .split('\n')
                .map((value) => value.trim())
                .filter((value) => value.length > 0);
            for (const pid of pids) {
                const { stdout: processStdout } = await execFileAsync('ps', ['-p', pid, '-o', 'comm=']);
                const processName = processStdout.toString().trim();
                if (processName.includes('xcodebuild') ||
                    processName.includes('XCTest') ||
                    processName.includes('xctrunner') ||
                    processName.includes('iosUITests')) {
                    common_1.Logger.i(`Killing stale process ${pid} (${processName}) on port ${port}`);
                    await execFileAsync('kill', ['-9', pid]);
                }
            }
        }
        catch {
            // Port cleanup is best-effort for simulator startup.
        }
    }
    async _updateIOSAppIds(deviceId, grpcClient, options) {
        const appIds = await this._simctlClient.listInstalledAppIds(deviceId);
        common_1.Logger.i(`Sending ${appIds.length} iOS app IDs to driver...`);
        const updateResponse = await grpcClient.updateAppIds(appIds);
        if (updateResponse.success) {
            return;
        }
        const message = `Failed to update iOS app IDs: ${updateResponse.message ?? 'unknown error'}`;
        if (options.throwOnFailure) {
            throw new Error(message);
        }
        common_1.Logger.w(message);
    }
    _formatWaitStatus(state) {
        const processState = state.failureMessage
            ? 'process reported a startup failure'
            : 'process running';
        const lastLog = state.recentLogs.at(-1);
        return lastLog
            ? `${processState}; last log: ${lastLog}`
            : `${processState}; no driver output yet`;
    }
}
exports.IOSSimulatorSetup = IOSSimulatorSetup;
//# sourceMappingURL=IOSSimulatorSetup.js.map