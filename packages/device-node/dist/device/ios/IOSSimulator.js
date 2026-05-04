"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOSSimulator = void 0;
const common_1 = require("@usb-ui-test/common");
const SimctlClient_js_1 = require("../../infra/ios/SimctlClient.js");
class IOSSimulator {
    _commonDriverActions;
    _simctlClient;
    _deviceId;
    _driverProcess;
    _restartDriverFn;
    constructor(params) {
        this._commonDriverActions = params.commonDriverActions;
        this._simctlClient = params.simctlClient;
        this._deviceId = params.deviceId;
        this._driverProcess = params.driverProcess;
        this._restartDriverFn = params.restartDriver;
    }
    setShouldEnsureStability(shouldEnsureStability) {
        this._commonDriverActions.setShouldEnsureStability(shouldEnsureStability);
    }
    isConnected() {
        return this._commonDriverActions.isConnected();
    }
    async tap(action) {
        return this._withDriverRecovery('tap', () => this._commonDriverActions.tap(action));
    }
    async tapPercent(action) {
        return this._withDriverRecovery('tapPercent', () => this._commonDriverActions.tapPercent(action));
    }
    async longPress(action) {
        return this._withDriverRecovery('longPress', () => this._commonDriverActions.longPress(action));
    }
    async enterText(action) {
        return this._withDriverRecovery('enterText', () => this._commonDriverActions.enterText(action));
    }
    async eraseText(action) {
        return this._withDriverRecovery('eraseText', () => this._commonDriverActions.eraseText(action));
    }
    async scrollAbs(action) {
        return this._withDriverRecovery('scrollAbs', () => this._commonDriverActions.swipe(action));
    }
    async back(_action) {
        return await this._commonDriverActions.back();
    }
    async home(_action) {
        return this._toResponse(await this._simctlClient.pressButton(this._deviceId, 'home'));
    }
    async rotate(action) {
        return this._withDriverRecovery('rotate', () => this._commonDriverActions.rotate(action));
    }
    async hideKeyboard(_action) {
        return this._withDriverRecovery('hideKeyboard', () => this._commonDriverActions.hideKeyboard());
    }
    async pressKey(action) {
        const physicalButton = this._getPhysicalButtonForKey(action.key);
        if (physicalButton) {
            return this._toResponse(await this._simctlClient.pressButton(this._deviceId, physicalButton));
        }
        return this._withDriverRecovery('pressKey', () => this._commonDriverActions.pressKey(action));
    }
    async launchApp(action) {
        try {
            await this.refreshInstalledAppIds({ throwOnFailure: false });
        }
        catch (error) {
            common_1.Logger.w('Failed to refresh iOS app IDs before launch:', error);
        }
        if (action.stopAppBeforeLaunch) {
            const terminateResult = await this._simctlClient.terminateAppResult(this._deviceId, action.appUpload.packageName);
            if (!terminateResult.success) {
                return this._toResponse(terminateResult);
            }
        }
        if (action.clearState) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'iOS clearState is not supported in usb-ui-test-ts without an install artifact path for reinstall.',
            });
        }
        let permissionsResult = null;
        if (action.allowAllPermissions) {
            permissionsResult = await this._simctlClient.allowAllPermissions(this._deviceId, action.appUpload.packageName);
        }
        else if (Object.keys(action.permissions).length > 0) {
            permissionsResult = await this._simctlClient.togglePermissions(this._deviceId, action.appUpload.packageName, action.permissions);
        }
        if (permissionsResult && !permissionsResult.success) {
            return this._toResponse(permissionsResult);
        }
        const launchResponse = await this._withDriverRecovery('launchApp', () => this._commonDriverActions.launchApp(action));
        return this._mergeLaunchResponse(launchResponse, permissionsResult);
    }
    async killApp(action) {
        return this._toResponse(await this._simctlClient.terminateAppResult(this._deviceId, action.packageName));
    }
    async openDeepLink(action) {
        const opened = await this._simctlClient.openUrl(this._deviceId, action.deeplink);
        return new common_1.DeviceNodeResponse({
            success: opened,
            message: opened
                ? `Successfully opened deep link: ${action.deeplink}`
                : `Failed to open deep link: ${action.deeplink}`,
        });
    }
    async setLocation(action) {
        return this._toResponse(await this._simctlClient.setLocation(this._deviceId, action.lat, action.long));
    }
    async switchToPrimaryApp(action) {
        return this._toResponse(await this._simctlClient.bringAppToForeground(this._deviceId, action.packageName));
    }
    async checkAppInForeground(action) {
        return this._withDriverRecovery('checkAppInForeground', () => this._commonDriverActions.checkAppInForeground(action));
    }
    async captureState(traceStep) {
        return this._withDriverRecovery('captureState', () => this._commonDriverActions.captureState(traceStep));
    }
    async getInstalledAppsResponse() {
        const apps = await this.getInstalledApps();
        return new common_1.DeviceNodeResponse({
            success: true,
            data: {
                apps: apps.map((app) => app.toJson()),
            },
        });
    }
    async getInstalledApps() {
        return await this._simctlClient.listInstalledApps(this._deviceId);
    }
    async getScreenshot(action) {
        return this._withDriverRecovery('getScreenshot', () => this._commonDriverActions.getScreenshot(action));
    }
    async getHierarchy(action) {
        return this._withDriverRecovery('getHierarchy', () => this._commonDriverActions.getHierarchy(action));
    }
    async getScreenshotAndHierarchy() {
        return this._withDriverRecovery('getScreenshotAndHierarchy', () => this._commonDriverActions.getScreenshotAndHierarchy());
    }
    async refreshInstalledAppIds(options) {
        const appIds = await this._simctlClient.listInstalledAppIds(this._deviceId);
        common_1.Logger.i(`Sending ${appIds.length} iOS app IDs to driver...`);
        const updateResponse = await this._withDriverRecovery('updateAppIds', () => this._commonDriverActions.updateAppIds(appIds));
        if (updateResponse.success) {
            return;
        }
        const message = `Failed to update iOS app IDs: ${updateResponse.message ?? 'unknown error'}`;
        if (options.throwOnFailure) {
            throw new Error(message);
        }
        common_1.Logger.w(message);
    }
    async close() {
        try {
            await this._simctlClient.terminateApp(this._deviceId, SimctlClient_js_1.IOS_DRIVER_RUNNER_BUNDLE_ID);
        }
        finally {
            this._commonDriverActions.close();
        }
    }
    async resolveLogFilterIdentifier(appIdentifier) {
        return await this._simctlClient.getAppExecutableName(this._deviceId, appIdentifier);
    }
    killDriver() {
        this._commonDriverActions.killDriver();
    }
    _getPhysicalButtonForKey(key) {
        const normalizedKey = key.trim().toLowerCase().replace(/[\s-]+/g, '_');
        switch (normalizedKey) {
            case 'home':
            case 'menu':
                return 'home';
            case 'lock':
            case 'power':
                return 'lock';
            case 'volume_up':
            case 'volumeup':
                return 'volumeup';
            case 'volume_down':
            case 'volumedown':
                return 'volumedown';
            default:
                return null;
        }
    }
    _toResponse(result) {
        return new common_1.DeviceNodeResponse({
            success: result.success,
            message: result.message,
            data: result.data,
        });
    }
    // ---------------------------------------------------------------------------
    // Driver recovery — detects driver death via process state, restarts if needed
    // ---------------------------------------------------------------------------
    _isDriverAlive() {
        return this._driverProcess.exitCode === null && !this._driverProcess.killed;
    }
    async _withDriverRecovery(opName, fn) {
        try {
            return await fn();
        }
        catch (error) {
            // Check process state — the source of truth, no error parsing
            if (this._isDriverAlive())
                throw error;
            common_1.Logger.w(`IOSSimulator.${opName}: driver process exited, attempting restart...`);
            try {
                this._driverProcess = await this._restartDriverFn();
            }
            catch (restartError) {
                common_1.Logger.e(`IOSSimulator.${opName}: driver restart failed`, restartError);
                throw error;
            }
            return await fn();
        }
    }
    _mergeLaunchResponse(launchResponse, permissionsResult) {
        if (!permissionsResult?.message && !permissionsResult?.data) {
            return launchResponse;
        }
        return new common_1.DeviceNodeResponse({
            success: launchResponse.success,
            message: [launchResponse.message, permissionsResult.message]
                .filter((message) => Boolean(message))
                .join(' '),
            data: {
                ...(launchResponse.data ?? {}),
                ...(permissionsResult.data ?? {}),
            },
        });
    }
}
exports.IOSSimulator = IOSSimulator;
//# sourceMappingURL=IOSSimulator.js.map