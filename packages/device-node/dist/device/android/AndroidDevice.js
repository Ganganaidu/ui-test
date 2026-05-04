"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidDevice = void 0;
const common_1 = require("@usb-ui-test/common");
class AndroidDevice {
    _commonDriverActions;
    _adbClient;
    _adbPath;
    _deviceSerial;
    constructor(params) {
        this._commonDriverActions = params.commonDriverActions;
        this._adbClient = params.adbClient;
        this._adbPath = params.adbPath;
        this._deviceSerial = params.deviceSerial;
    }
    setShouldEnsureStability(shouldEnsureStability) {
        this._commonDriverActions.setShouldEnsureStability(shouldEnsureStability);
    }
    isConnected() {
        return this._commonDriverActions.isConnected();
    }
    async tap(action) {
        return await this._commonDriverActions.tap(action);
    }
    async tapPercent(action) {
        return await this._commonDriverActions.tapPercent(action);
    }
    async longPress(action) {
        return await this._commonDriverActions.longPress(action);
    }
    async enterText(action) {
        return await this._commonDriverActions.enterText(action);
    }
    async eraseText(action) {
        return await this._commonDriverActions.eraseText(action);
    }
    async scrollAbs(action) {
        const response = await this._adbClient.swipe(this._adbPath, this._deviceSerial, {
            startX: action.startX,
            startY: action.startY,
            endX: action.endX,
            endY: action.endY,
            durationMs: action.durationMs,
        });
        return new common_1.DeviceNodeResponse({
            success: response.success,
            message: response.message,
        });
    }
    async back(_action) {
        return this._toResponse(await this._adbClient.back(this._adbPath, this._deviceSerial));
    }
    async home(_action) {
        return this._toResponse(await this._adbClient.home(this._adbPath, this._deviceSerial));
    }
    async rotate(action) {
        return this._toResponse(await this._adbClient.rotate(this._adbPath, this._deviceSerial));
    }
    async hideKeyboard(_action) {
        return this._toResponse(await this._adbClient.hideKeyboard(this._adbPath, this._deviceSerial));
    }
    async pressKey(action) {
        const adbResult = await this._adbClient.performKeyPress(this._adbPath, this._deviceSerial, action.key);
        if (adbResult.success || adbResult.data?.['handled'] !== false) {
            return this._toResponse(adbResult);
        }
        return await this._commonDriverActions.pressKey(action);
    }
    async launchApp(action) {
        const packageCheck = await this._adbClient.isPackageInstalled(this._adbPath, this._deviceSerial, action.appUpload.packageName);
        if (!packageCheck.success) {
            return this._toResponse(packageCheck);
        }
        if (action.stopAppBeforeLaunch) {
            const stopResult = await this._adbClient.forceStop(this._adbPath, this._deviceSerial, action.appUpload.packageName);
            if (!stopResult.success) {
                return this._toResponse(stopResult);
            }
        }
        if (action.clearState) {
            const clearResult = await this._adbClient.clearAppData(this._adbPath, this._deviceSerial, action.appUpload.packageName);
            if (!clearResult.success) {
                return this._toResponse(clearResult);
            }
        }
        if (action.allowAllPermissions) {
            const permissionsResult = await this._adbClient.allowAllPermissions(this._adbPath, this._deviceSerial, action.appUpload.packageName);
            if (!permissionsResult.success) {
                return this._toResponse(permissionsResult);
            }
        }
        else if (Object.keys(action.permissions).length > 0) {
            const permissionsResult = await this._adbClient.togglePermissions(this._adbPath, this._deviceSerial, action.appUpload.packageName, action.permissions);
            if (!permissionsResult.success) {
                return this._toResponse(permissionsResult);
            }
        }
        return await this._commonDriverActions.launchApp(action);
    }
    async killApp(action) {
        return this._toResponse(await this._adbClient.forceStop(this._adbPath, this._deviceSerial, action.packageName));
    }
    async openDeepLink(action) {
        const opened = await this._adbClient.openDeepLink(this._adbPath, this._deviceSerial, action.deeplink);
        return new common_1.DeviceNodeResponse({
            success: opened,
            message: opened
                ? `Successfully opened deep link: ${action.deeplink}`
                : `Failed to open deep link: ${action.deeplink}`,
        });
    }
    async setLocation(action) {
        const mockLocationResult = await this._adbClient.performMockLocation(this._adbPath, this._deviceSerial);
        if (!mockLocationResult.success) {
            return this._toResponse(mockLocationResult);
        }
        return await this._commonDriverActions.setLocation(action);
    }
    async switchToPrimaryApp(action) {
        return this._toResponse(await this._adbClient.bringAppToForeground(this._adbPath, this._deviceSerial, action.packageName));
    }
    async checkAppInForeground(action) {
        return await this._commonDriverActions.checkAppInForeground(action);
    }
    async captureState(traceStep) {
        return await this._commonDriverActions.captureState(traceStep);
    }
    async getInstalledAppsResponse() {
        return await this._commonDriverActions.getInstalledAppsResponseFromDriver();
    }
    async getInstalledApps() {
        return await this._commonDriverActions.getInstalledAppsFromDriver();
    }
    async getScreenshot(action) {
        return await this._commonDriverActions.getScreenshot(action);
    }
    async getHierarchy(action) {
        return await this._commonDriverActions.getHierarchy(action);
    }
    async getScreenshotAndHierarchy() {
        return await this._commonDriverActions.getScreenshotAndHierarchy();
    }
    async close() {
        try {
            await this._adbClient.removePortForward(this._adbPath, this._deviceSerial);
        }
        finally {
            this._commonDriverActions.close();
        }
    }
    killDriver() {
        this._commonDriverActions.killDriver();
    }
    _toResponse(result) {
        return new common_1.DeviceNodeResponse({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    }
}
exports.AndroidDevice = AndroidDevice;
//# sourceMappingURL=AndroidDevice.js.map