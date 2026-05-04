"use strict";
// Port of device_node/lib/device/Device.dart
// Implements the DeviceAgent interface with a stable wrapper over a platform runtime.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
const common_1 = require("@usb-ui-test/common");
const RecordingManager_js_1 = require("./RecordingManager.js");
const LogCaptureManager_js_1 = require("./LogCaptureManager.js");
/**
 * Represents a single connected device and implements the DeviceAgent interface.
 * Bridges DeviceActionRequest -> runtime capability methods.
 *
 * Dart equivalent: Device in device_node/lib/device/Device.dart
 */
class Device {
    _deviceInfo;
    _runtime;
    _apiKey = '';
    _disconnectionCallback = null;
    _recordingController;
    _logCaptureController;
    constructor(params) {
        this._deviceInfo = params.deviceInfo;
        this._runtime = params.runtime;
        this._recordingController = params.recordingController ?? RecordingManager_js_1.defaultRecordingManager;
        this._logCaptureController = params.logCaptureController ?? LogCaptureManager_js_1.defaultLogCaptureManager;
    }
    async setUp(_options) {
        if (!this._runtime.isConnected()) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'gRPC client not connected',
            });
        }
        return new common_1.DeviceNodeResponse({ success: true });
    }
    async executeAction(request) {
        try {
            this._runtime.setShouldEnsureStability(request.shouldEnsureStability);
            const action = request.action;
            switch (action.type) {
                case common_1.DeviceAction.TAP:
                    return await this._runtime.tap(action);
                case common_1.DeviceAction.TAP_PERCENT:
                    return await this._runtime.tapPercent(action);
                case common_1.DeviceAction.LONG_PRESS:
                    return await this._runtime.longPress(action);
                case common_1.DeviceAction.ENTER_TEXT:
                    return await this._runtime.enterText(action);
                case common_1.DeviceAction.ERASE_TEXT:
                    return await this._runtime.eraseText(action);
                case common_1.DeviceAction.SCROLL_ABS:
                    return await this._runtime.scrollAbs(action);
                case common_1.DeviceAction.BACK:
                    return await this._runtime.back(action);
                case common_1.DeviceAction.HOME:
                    return await this._runtime.home(action);
                case common_1.DeviceAction.ROTATE:
                    return await this._runtime.rotate(action);
                case common_1.DeviceAction.HIDE_KEYBOARD:
                    return await this._runtime.hideKeyboard(action);
                case common_1.DeviceAction.PRESS_KEY:
                    return await this._runtime.pressKey(action);
                case common_1.DeviceAction.LAUNCH_APP:
                    return await this._runtime.launchApp(action);
                case common_1.DeviceAction.KILL_APP:
                    return await this._runtime.killApp(action);
                case common_1.DeviceAction.DEEPLINK: {
                    const deeplinkAction = action;
                    common_1.Logger.d(`Executing deeplink action: ${deeplinkAction.deeplink}`);
                    return await this._runtime.openDeepLink(deeplinkAction);
                }
                case common_1.DeviceAction.SET_LOCATION:
                    return await this._runtime.setLocation(action);
                case common_1.DeviceAction.SWITCH_TO_PRIMARY_APP:
                    return await this._runtime.switchToPrimaryApp(action);
                case common_1.DeviceAction.CHECK_APP_IN_FOREGROUND:
                    return await this._runtime.checkAppInForeground(action);
                case common_1.DeviceAction.GET_SCREENSHOT_AND_HIERARCHY:
                    return await this._runtime.captureState(request.traceStep);
                case common_1.DeviceAction.GET_SCREENSHOT:
                    return await this._runtime.getScreenshot(action);
                case common_1.DeviceAction.GET_HIERARCHY:
                    return await this._runtime.getHierarchy(action);
                case common_1.DeviceAction.GET_APP_LIST:
                    return await this._runtime.getInstalledAppsResponse();
                case common_1.DeviceAction.WAIT:
                    return new common_1.DeviceNodeResponse({ success: true });
                default:
                    return new common_1.DeviceNodeResponse({
                        success: false,
                        message: `Unsupported action type: ${action.type}`,
                    });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            common_1.Logger.e(`Action execution failed: ${message}`);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Action failed: ${message}`,
            });
        }
    }
    isConnected() {
        return this._runtime.isConnected();
    }
    getDeviceInfo() {
        return this._deviceInfo;
    }
    async closeConnection() {
        try {
            await this.recordingCleanUp();
        }
        catch (error) {
            common_1.Logger.w('Failed to clean up recording resources:', error);
        }
        try {
            await this.logCaptureCleanUp();
        }
        catch (error) {
            common_1.Logger.w('Failed to clean up log capture resources:', error);
        }
        await this._runtime.close();
    }
    killDriver() {
        this._runtime.killDriver();
    }
    setApiKey(apiKey) {
        this._apiKey = apiKey;
    }
    getId() {
        return this._deviceInfo.deviceUUID;
    }
    listenForDeviceDisconnection(callbacks) {
        this._disconnectionCallback = callbacks.onDeviceDisconnected;
    }
    clearListener() {
        this._disconnectionCallback = null;
    }
    async startRecording(recordingRequest) {
        if (!this._deviceInfo.id) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'Device ID is required to start recording.',
            });
        }
        return await this._recordingController.startRecording({
            deviceId: this._deviceInfo.id,
            recordingRequest,
            platform: this._deviceInfo.getPlatform(),
            sdkVersion: this._deviceInfo.sdkVersion > 0 ? String(this._deviceInfo.sdkVersion) : undefined,
        });
    }
    async stopRecording(runId, testId) {
        return await this._recordingController.stopRecording(runId, testId, {
            platform: this._deviceInfo.getPlatform(),
            keepOutput: true,
        });
    }
    async recordingCleanUp() {
        if (!this._deviceInfo.id) {
            return;
        }
        await this._recordingController.cleanupDevice(this._deviceInfo.id, {
            platform: this._deviceInfo.getPlatform(),
            keepOutput: false,
        });
    }
    async abortRecording(runId, keepOutput = false) {
        if (!this._deviceInfo.id) {
            return;
        }
        await this._recordingController.abortRecording(runId, {
            deviceId: this._deviceInfo.id,
            platform: this._deviceInfo.getPlatform(),
            keepOutput,
        });
    }
    async startLogCapture(request) {
        if (!this._deviceInfo.id) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'Device ID is required to start log capture.',
            });
        }
        let logIdentifier = request.appIdentifier;
        if (logIdentifier && this._runtime.resolveLogFilterIdentifier) {
            const resolved = await this._runtime.resolveLogFilterIdentifier(logIdentifier);
            if (resolved) {
                logIdentifier = resolved;
            }
            else {
                common_1.Logger.w(`Could not resolve log filter identifier for "${logIdentifier}"; capturing unfiltered log`);
                logIdentifier = undefined;
            }
        }
        return await this._logCaptureController.startLogCapture({
            deviceId: this._deviceInfo.id,
            runId: request.runId,
            testId: request.testId,
            platform: this._deviceInfo.getPlatform(),
            appIdentifier: logIdentifier,
        });
    }
    async stopLogCapture(runId, testId) {
        return await this._logCaptureController.stopLogCapture(runId, testId, {
            platform: this._deviceInfo.getPlatform(),
            keepOutput: true,
        });
    }
    async abortLogCapture(runId, keepOutput = false) {
        if (!this._deviceInfo.id) {
            return;
        }
        await this._logCaptureController.abortLogCapture(runId, {
            deviceId: this._deviceInfo.id,
            platform: this._deviceInfo.getPlatform(),
            keepOutput,
        });
    }
    async logCaptureCleanUp() {
        if (!this._deviceInfo.id) {
            return;
        }
        await this._logCaptureController.cleanupDevice(this._deviceInfo.id, {
            platform: this._deviceInfo.getPlatform(),
            keepOutput: false,
        });
    }
    uninstallDriver() {
        common_1.Logger.d(`Uninstall driver for device: ${this._deviceInfo.deviceUUID}`);
    }
    // ---------------------------------------------------------------------------
    // DriverHandle surface — exposed so the deterministic local-executor can
    // use session.device directly without reaching into the private _runtime.
    // These simply delegate to the DeviceRuntime that backs this Device.
    // ---------------------------------------------------------------------------
    async tap(action) {
        return this._runtime.tap(action);
    }
    async enterText(action) {
        return this._runtime.enterText(action);
    }
    async scrollAbs(action) {
        return this._runtime.scrollAbs(action);
    }
    async launchApp(action) {
        return this._runtime.launchApp(action);
    }
    async getScreenshotAndHierarchy() {
        const response = await this._runtime.getScreenshotAndHierarchy();
        return response;
    }
    async getInstalledApps() {
        return await this._runtime.getInstalledApps();
    }
}
exports.Device = Device;
//# sourceMappingURL=Device.js.map