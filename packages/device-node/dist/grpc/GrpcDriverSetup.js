"use strict";
// Port of device_node/lib/device/GrpcDriverSetup.dart
// Handles driver app installation and gRPC connection setup.
// MATCHES Dart logic: install -> port forward -> start driver (background) -> poll with ping
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcDriverSetup = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const common_1 = require("@usb-ui-test/common");
const AndroidDevice_js_1 = require("../device/android/AndroidDevice.js");
const Device_js_1 = require("../device/Device.js");
const LogCaptureManager_js_1 = require("../device/LogCaptureManager.js");
const IOSSimulator_js_1 = require("../device/ios/IOSSimulator.js");
const CommonDriverActions_js_1 = require("../device/shared/CommonDriverActions.js");
const GrpcDriverClient_js_1 = require("./GrpcDriverClient.js");
const AndroidDeviceSetup_js_1 = require("./setup/AndroidDeviceSetup.js");
const IOSSimulatorSetup_js_1 = require("./setup/IOSSimulatorSetup.js");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Sets up the gRPC connection to a device's driver app.
 * Flow: install driver -> connect gRPC -> return a wrapped platform runtime.
 *
 * Dart equivalent: GrpcDriverSetup in device_node/lib/device/GrpcDriverSetup.dart
 */
class GrpcDriverSetup {
    _adbClient;
    _simctlClient;
    _filePathUtil;
    _grpcClientFactory;
    _delayFn;
    _captureReadinessTimeoutMs;
    _captureReadinessDelayMs;
    _killStaleHostProcessesOnPortFn;
    _startAndroidDriverFn;
    _androidDeviceSetup;
    _iosSimulatorSetup;
    constructor(params) {
        this._adbClient = params.adbClient;
        this._simctlClient = params.simctlClient;
        this._filePathUtil = params.filePathUtil;
        this._grpcClientFactory = params.grpcClientFactory ?? (() => new GrpcDriverClient_js_1.GrpcDriverClient());
        this._delayFn = params.delayFn ?? ((ms) => this._delay(ms));
        this._captureReadinessTimeoutMs = params.captureReadinessTimeoutMs ?? 15000;
        this._captureReadinessDelayMs = params.captureReadinessDelayMs ?? 500;
        this._killStaleHostProcessesOnPortFn =
            params.killStaleHostProcessesOnPortFn ??
                ((port) => this._killStaleHostProcessesOnPort(port));
        this._startAndroidDriverFn =
            params.startAndroidDriverFn ??
                ((adbPath, deviceSerial, port) => this._startAndroidDriver(adbPath, deviceSerial, port));
        this._androidDeviceSetup = new AndroidDeviceSetup_js_1.AndroidDeviceSetup({
            adbClient: this._adbClient,
            filePathUtil: this._filePathUtil,
            connectWithPolling: async (grpcClient, host, port, options) => await this._connectWithPolling(grpcClient, host, port, options),
            startAndroidDriverFn: this._startAndroidDriverFn,
            captureReadinessTimeoutMs: this._captureReadinessTimeoutMs,
            captureReadinessDelayMs: this._captureReadinessDelayMs,
        });
        this._iosSimulatorSetup = new IOSSimulatorSetup_js_1.IOSSimulatorSetup({
            simctlClient: this._simctlClient,
            filePathUtil: this._filePathUtil,
            connectWithPolling: async (grpcClient, host, port, options) => await this._connectWithPolling(grpcClient, host, port, options),
            captureReadinessTimeoutMs: this._captureReadinessTimeoutMs,
            captureReadinessDelayMs: this._captureReadinessDelayMs,
            killStaleHostProcessesOnPortFn: this._killStaleHostProcessesOnPortFn,
        });
    }
    async setUp(deviceInfo) {
        const grpcClient = this._grpcClientFactory();
        try {
            const { runtime, adbPath } = await this._createRuntime(deviceInfo, grpcClient);
            return new Device_js_1.Device({
                deviceInfo,
                runtime,
                logCaptureController: new LogCaptureManager_js_1.LogCaptureManager({ adbPath }),
            });
        }
        catch (error) {
            grpcClient.close();
            throw error;
        }
    }
    async _createRuntime(deviceInfo, grpcClient) {
        const commonDriverActions = new CommonDriverActions_js_1.CommonDriverActions({ grpcClient });
        if (deviceInfo.isAndroid) {
            const prepared = await this._androidDeviceSetup.prepare(deviceInfo, grpcClient);
            return {
                runtime: new AndroidDevice_js_1.AndroidDevice({
                    commonDriverActions,
                    adbClient: this._adbClient,
                    adbPath: prepared.adbPath,
                    deviceSerial: prepared.deviceSerial,
                }),
                adbPath: prepared.adbPath,
            };
        }
        const prepared = await this._iosSimulatorSetup.prepare(deviceInfo, grpcClient);
        return {
            runtime: new IOSSimulator_js_1.IOSSimulator({
                commonDriverActions,
                simctlClient: this._simctlClient,
                deviceId: prepared.deviceId,
                driverProcess: prepared.driverProcess,
                restartDriver: prepared.restartDriver,
            }),
        };
    }
    /**
     * Connects to the gRPC server with polling.
     * Matches Dart: creates channel once, then polls with ping().
     * 240 attempts x 500ms = 120 seconds total timeout.
     */
    async _connectWithPolling(grpcClient, host, port, options) {
        const maxAttempts = 240;
        const delayMs = 500;
        common_1.Logger.d(`GrpcDriverSetup: Creating channel to ${host}:${port}`);
        grpcClient.createChannel(host, port);
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const startupFailure = options?.getStartupFailureMessage?.();
            if (startupFailure) {
                throw new Error(startupFailure);
            }
            if (attempt > 0 && attempt % 20 === 0) {
                const waitStatus = options?.getWaitStatusMessage?.();
                common_1.Logger.i(waitStatus
                    ? `Still waiting for driver... (${(attempt * 500) / 1000}s) ${waitStatus}`
                    : `Still waiting for driver... (${(attempt * 500) / 1000}s)`);
            }
            try {
                const connected = await grpcClient.ping();
                if (connected) {
                    common_1.Logger.i(`Connected after ${attempt + 1} attempts (${((attempt + 1) * 500) / 1000}s)`);
                    return true;
                }
            }
            catch {
                // Ping failures are expected while the driver is still starting.
            }
            const postAttemptFailure = options?.getStartupFailureMessage?.();
            if (postAttemptFailure) {
                throw new Error(postAttemptFailure);
            }
            await this._delayFn(delayMs);
        }
        const timeoutMessage = options?.getTimeoutMessage?.();
        if (timeoutMessage) {
            throw new Error(timeoutMessage);
        }
        common_1.Logger.e('Failed to connect after 120s (driver did not start)');
        return false;
    }
    _startAndroidDriver(adbPath, deviceSerial, port) {
        const args = [
            '-s',
            deviceSerial,
            'shell',
            'am',
            'instrument',
            '-w',
            '-e',
            'port',
            String(port),
            '-e',
            'app_perfect_device_id',
            deviceSerial,
            '-e',
            'class',
            'app.usbuitest.driver.UsbUiTestTest#testDriver',
            'app.usbuitest.driver.test/androidx.test.runner.AndroidJUnitRunner',
        ];
        common_1.Logger.d(`Starting driver: ${adbPath} ${args.join(' ')}`);
        const child = (0, child_process_1.spawn)(adbPath, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
        });
        return child;
    }
    _delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
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
}
exports.GrpcDriverSetup = GrpcDriverSetup;
//# sourceMappingURL=GrpcDriverSetup.js.map