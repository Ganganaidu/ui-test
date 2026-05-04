"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidDeviceSetup = void 0;
const common_1 = require("@usb-ui-test/common");
const ScreenshotCaptureCoordinator_js_1 = require("../../capture/ScreenshotCaptureCoordinator.js");
const AdbClient_js_1 = require("../../infra/android/AdbClient.js");
/**
 * Thrown when the gRPC server is reachable but UiAutomation never finished
 * binding within the capture-readiness window. Separate from generic errors
 * so `prepare` can retry once before rolling back.
 */
class CaptureReadinessError extends Error {
    isCaptureReadinessFailure = true;
    constructor(message) {
        super(message);
        this.name = 'CaptureReadinessError';
    }
}
class AndroidDeviceSetup {
    _adbClient;
    _filePathUtil;
    _connectWithPolling;
    _startAndroidDriverFn;
    _captureReadinessTimeoutMs;
    _captureReadinessDelayMs;
    constructor(params) {
        this._adbClient = params.adbClient;
        this._filePathUtil = params.filePathUtil;
        this._connectWithPolling = params.connectWithPolling;
        this._startAndroidDriverFn = params.startAndroidDriverFn;
        this._captureReadinessTimeoutMs = params.captureReadinessTimeoutMs;
        this._captureReadinessDelayMs = params.captureReadinessDelayMs;
    }
    async prepare(deviceInfo, grpcClient) {
        const deviceSerial = deviceInfo.id;
        if (!deviceSerial) {
            throw new Error('Android device serial is required for driver setup.');
        }
        const adbPath = await this._filePathUtil.getADBPath();
        if (!adbPath) {
            throw new Error('ADB not found. Please install Android SDK platform-tools.');
        }
        await this._cleanupStaleDriverProcesses(adbPath, deviceSerial);
        let driverInstalled = false;
        let testRunnerInstalled = false;
        let localPort = null;
        let driverProcess = null;
        let startupState = null;
        try {
            const driverPath = await this._filePathUtil.getDriverAppPath();
            if (!driverPath) {
                throw new Error('Driver app APK not found. Configure USB_UI_TEST_ASSET_DIR, USB_UI_TEST_ASSET_MANIFEST_PATH, or USB_UI_TEST_ASSET_MANIFEST_URL.');
            }
            common_1.Logger.i(`Installing driver app on ${deviceSerial}...`);
            const installed = await this._adbClient.installApp(adbPath, deviceSerial, driverPath);
            if (!installed) {
                throw new Error('Failed to install driver app APK');
            }
            driverInstalled = true;
            const testAppPath = await this._filePathUtil.getDriverTestAppPath();
            if (testAppPath) {
                common_1.Logger.i(`Installing test runner APK on ${deviceSerial}...`);
                // Use installTestApp (adds -t flag) so the package manager registers
                // the instrumentation component — required on Android 10+.
                const testInstalled = await this._adbClient.installTestApp(adbPath, deviceSerial, testAppPath);
                if (!testInstalled) {
                    throw new Error('Failed to install test runner APK');
                }
                testRunnerInstalled = true;
            }
            else {
                common_1.Logger.w('Test runner APK not found - instrumentation may fail');
            }
            await this._adbClient.removePortForward(adbPath, deviceSerial);
            // forwardPort allocates a port from the AdbClient's pool and uses
            // the same value on both sides of the forward. The driver app gets
            // launched with `-e port localPort` so all references line up.
            localPort = await this._adbClient.forwardPort(adbPath, deviceSerial);
            let spawned = await this._spawnDriverAndAwaitGrpc(adbPath, deviceSerial, localPort, grpcClient);
            driverProcess = spawned.driverProcess;
            startupState = spawned.startupState;
            try {
                await this._awaitCaptureReadiness(spawned.startupState, grpcClient);
            }
            catch (err) {
                if (!(err instanceof CaptureReadinessError)) {
                    throw err;
                }
                common_1.Logger.w(`Driver reached gRPC but UiAutomation never bound on ${deviceSerial} (${err.message}); retrying once after deep cleanup`);
                const priorProcessGone = await this._tearDownDriverAttempt(adbPath, deviceSerial, spawned.driverProcess);
                driverProcess = null;
                startupState = null;
                if (!priorProcessGone) {
                    // The prior instrumentation host is still alive after the cleanup
                    // cap, so its UiAutomation binding is likely still held. Starting a
                    // second `am instrument` now would race the same stale binding the
                    // retry is meant to escape — bail and surface the original readiness
                    // error instead of masking it with a second failure.
                    throw err;
                }
                spawned = await this._spawnDriverAndAwaitGrpc(adbPath, deviceSerial, localPort, grpcClient);
                driverProcess = spawned.driverProcess;
                startupState = spawned.startupState;
                await this._awaitCaptureReadiness(spawned.startupState, grpcClient);
            }
            spawned.startupState.setupComplete = true;
            common_1.Logger.i('gRPC connection established successfully');
            return { adbPath, deviceSerial };
        }
        catch (error) {
            await this._rollbackFailedSetup({
                adbPath,
                deviceSerial,
                localPort,
                driverProcess,
                driverInstalled,
                testRunnerInstalled,
            });
            throw error;
        }
    }
    _trackAndroidDriverProcess(deviceSerial, driverProcess) {
        const state = {
            setupComplete: false,
            failureMessage: null,
            recentLogs: [],
            processEnded: false,
            exitDescription: null,
            pid: driverProcess.pid,
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
                common_1.Logger.d(`Android driver ${source}: ${trimmed}`);
                state.recentLogs.push(`${source}: ${trimmed}`);
                if (state.recentLogs.length > 20) {
                    state.recentLogs.shift();
                }
            }
        };
        driverProcess.stdout?.on('data', (chunk) => appendLog('stdout', chunk));
        driverProcess.stderr?.on('data', (chunk) => appendLog('stderr', chunk));
        driverProcess.on('error', (error) => {
            state.processEnded = true;
            state.exitDescription = `error: ${error.message}`;
            state.failureMessage = `Android driver process error for ${deviceSerial}: ${error.message}`;
            common_1.Logger.e(state.failureMessage);
        });
        driverProcess.on('exit', (code, signal) => {
            state.processEnded = true;
            state.exitDescription =
                code !== null ? `code ${code}` : signal ? `signal ${signal}` : 'unknown status';
            const logSuffix = state.recentLogs.length > 0 ? ` Logs: ${state.recentLogs.join(' | ')}` : '';
            if (!state.setupComplete) {
                state.failureMessage =
                    `Android driver process exited before setup completed (${state.exitDescription}) for ${deviceSerial}.${logSuffix}`;
                common_1.Logger.e(state.failureMessage);
            }
            else {
                common_1.Logger.i(`Android driver process ended for ${deviceSerial} (${state.exitDescription})`);
            }
        });
        return state;
    }
    _formatWaitStatus(state) {
        const processState = state.processEnded
            ? `process exited (${state.exitDescription ?? 'unknown status'})`
            : `process alive${state.pid ? ` pid=${state.pid}` : ''}`;
        const lastLog = state.recentLogs.at(-1);
        return lastLog
            ? `${processState}; last log: ${lastLog}`
            : `${processState}; no driver output yet`;
    }
    _buildTimeoutMessage(deviceSerial, localPort, state) {
        const processState = state.processEnded
            ? `exited (${state.exitDescription ?? 'unknown status'})`
            : `alive${state.pid ? ` pid=${state.pid}` : ''}`;
        const logSummary = state.recentLogs.length > 0 ? state.recentLogs.join(' | ') : 'none';
        return (`Android device ${deviceSerial} was ready, but the driver never became reachable over ` +
            `gRPC at 127.0.0.1:${localPort} after 120s. Process state: ${processState}. ` +
            `Recent logs: ${logSummary}.`);
    }
    async _cleanupStaleDriverProcesses(adbPath, deviceSerial) {
        common_1.Logger.d(`Cleaning up stale driver processes on ${deviceSerial}...`);
        await this._adbClient.forceStop(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME, { suppressErrorLog: true });
        await this._adbClient.forceStop(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_APP_PACKAGE_NAME, { suppressErrorLog: true });
        // `pm clear` on the instrumentation test package evicts its process and
        // drops any AccessibilityManagerService binding held against its UID —
        // the root cause of second-run UiAutomation bind-with-id=-1 failures.
        // The test APK holds no user data, and the driver APK (which keeps the
        // runtime permissions granted via `adb install -g`) is deliberately not
        // cleared.
        await this._adbClient.clearAppData(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME);
        await this._waitForProcessGone(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME);
    }
    /**
     * Poll `pidof <package>` until the process disappears or the cap elapses.
     * Returns true if the process is confirmed gone, false on cap timeout.
     * Callers decide whether a timeout is fatal: pre-run cleanup treats it as
     * best-effort (subsequent phases will surface real problems), but the
     * inter-attempt retry path must NOT proceed on a timeout — the stale
     * UiAutomation binding we were waiting to release is the exact race the
     * retry is meant to avoid.
     */
    async _waitForProcessGone(adbPath, deviceSerial, packageName, capMs = 5000) {
        const pollMs = 250;
        const startedAt = Date.now();
        while (Date.now() - startedAt < capMs) {
            const running = await this._adbClient.isProcessRunning(adbPath, deviceSerial, packageName);
            if (!running) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, pollMs));
        }
        common_1.Logger.w(`Timed out waiting for ${packageName} on ${deviceSerial} to exit after ${capMs}ms`);
        return false;
    }
    /**
     * Install APKs already done; port forward already set up. This brings up a
     * single instrumentation attempt: spawn the driver, track its process, and
     * poll the gRPC port. On failure it cleans up the spawned process before
     * re-throwing so the caller doesn't leak a pid.
     */
    async _spawnDriverAndAwaitGrpc(adbPath, deviceSerial, localPort, grpcClient) {
        common_1.Logger.i('Starting Android driver instrumentation...');
        const driverProcess = this._startAndroidDriverFn(adbPath, deviceSerial, localPort);
        const startupState = this._trackAndroidDriverProcess(deviceSerial, driverProcess);
        try {
            common_1.Logger.i(`Waiting for Android driver gRPC at 127.0.0.1:${localPort}...`);
            const connected = await this._connectWithPolling(grpcClient, '127.0.0.1', localPort, {
                getStartupFailureMessage: () => startupState.failureMessage,
                getWaitStatusMessage: () => this._formatWaitStatus(startupState),
                getTimeoutMessage: () => this._buildTimeoutMessage(deviceSerial, localPort, startupState),
            });
            if (!connected) {
                throw new Error('Failed to connect to device via gRPC after 120s - driver did not start');
            }
            return { driverProcess, startupState };
        }
        catch (err) {
            if (!driverProcess.killed) {
                try {
                    driverProcess.kill('SIGKILL');
                }
                catch (killErr) {
                    common_1.Logger.w(`Failed to kill Android driver process after gRPC connect failure for ${deviceSerial}:`, killErr);
                }
            }
            throw err;
        }
    }
    /**
     * Poll `getScreenshotAndHierarchy` until UiAutomation is bound or the
     * capture-readiness window expires. Only the transient window-expired case
     * throws `CaptureReadinessError` so `prepare` retries once; a non-transient
     * failure (e.g. "device offline", permission denied) throws a plain Error
     * and falls straight to rollback. A process-death failure also surfaces
     * directly via `startupState.failureMessage` — no retry.
     */
    async _awaitCaptureReadiness(startupState, grpcClient) {
        const captureReady = await (0, ScreenshotCaptureCoordinator_js_1.waitForDriverCaptureReadiness)(grpcClient, {
            timeoutMs: this._captureReadinessTimeoutMs,
            delayMs: this._captureReadinessDelayMs,
        });
        if (!captureReady.ready) {
            if (startupState.failureMessage) {
                throw new Error(startupState.failureMessage);
            }
            const reason = captureReady.message ?? 'unknown capture readiness error';
            if (!captureReady.transient) {
                throw new Error(`Driver started and gRPC connected, but capture-readiness reported a non-transient failure: ${reason}`);
            }
            throw new CaptureReadinessError(`Driver started and gRPC connected, but UiAutomation never became ready for screenshot capture after ${this._captureReadinessTimeoutMs / 1000}s: ${reason}`);
        }
        if (startupState.failureMessage) {
            throw new Error(startupState.failureMessage);
        }
    }
    /**
     * Inter-attempt teardown used when the first driver start succeeded at the
     * gRPC level but failed the UiAutomation readiness gate. Kills the prior
     * process, force-stops both packages, clears the test package's state, and
     * waits for its process to exit before the next attempt starts.
     * Returns true if the prior instrumentation host is confirmed gone — the
     * retry should only proceed in that case.
     */
    async _tearDownDriverAttempt(adbPath, deviceSerial, driverProcess) {
        if (!driverProcess.killed) {
            try {
                driverProcess.kill('SIGKILL');
            }
            catch (error) {
                common_1.Logger.w(`Failed to kill previous Android driver process for ${deviceSerial}:`, error);
            }
        }
        await this._adbClient.forceStop(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME, { suppressErrorLog: true });
        await this._adbClient.forceStop(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_APP_PACKAGE_NAME, { suppressErrorLog: true });
        await this._adbClient.clearAppData(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME);
        return await this._waitForProcessGone(adbPath, deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME);
    }
    async _rollbackFailedSetup(params) {
        if (params.driverProcess && !params.driverProcess.killed) {
            try {
                const killed = params.driverProcess.kill('SIGKILL');
                common_1.Logger.i(`Killed Android driver host process for ${params.deviceSerial}: ${killed}`);
            }
            catch (error) {
                common_1.Logger.w(`Failed to kill Android driver host process for ${params.deviceSerial}:`, error);
            }
        }
        if (params.localPort !== null) {
            try {
                await this._adbClient.removePortForward(params.adbPath, params.deviceSerial);
            }
            catch (error) {
                common_1.Logger.w(`Failed to remove Android port forward for ${params.deviceSerial}:`, error);
            }
        }
        if (params.driverInstalled) {
            await this._adbClient.forceStop(params.adbPath, params.deviceSerial, AdbClient_js_1.ANDROID_DRIVER_APP_PACKAGE_NAME, { suppressErrorLog: true });
        }
        if (params.testRunnerInstalled) {
            await this._adbClient.forceStop(params.adbPath, params.deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME, { suppressErrorLog: true });
            // Ensure the instrumentation host is gone before returning control.
            // Otherwise the next `prepare()` can race a still-running `am instrument`
            // that still holds the old UiAutomation binding, reproducing the very
            // second-run failure this rollback is meant to clean up after.
            await this._waitForProcessGone(params.adbPath, params.deviceSerial, AdbClient_js_1.ANDROID_DRIVER_TEST_PACKAGE_NAME);
        }
    }
}
exports.AndroidDeviceSetup = AndroidDeviceSetup;
//# sourceMappingURL=AndroidDeviceSetup.js.map