"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonDriverActions = void 0;
const common_1 = require("@usb-ui-test/common");
const ScreenshotCaptureCoordinator_js_1 = require("../../capture/ScreenshotCaptureCoordinator.js");
const DeviceSession_js_1 = require("../DeviceSession.js");
class CommonDriverActions {
    _grpcClient;
    _session;
    _captureCoordinator;
    constructor(params) {
        this._grpcClient = params.grpcClient;
        this._session = params.session ?? new DeviceSession_js_1.DeviceSession();
        this._captureCoordinator =
            params.captureCoordinator ??
                new ScreenshotCaptureCoordinator_js_1.ScreenshotCaptureCoordinator({
                    grpcClient: this._grpcClient,
                    session: this._session,
                });
    }
    setShouldEnsureStability(shouldEnsureStability) {
        this._session.setShouldEnsureStability(shouldEnsureStability);
    }
    isConnected() {
        return this._grpcClient.isConnected;
    }
    async tap(action) {
        const response = await this._grpcClient.tap({
            x: action.point.x,
            y: action.point.y,
            repeat: action.repeat,
            delay: action.delay,
        });
        return new common_1.DeviceNodeResponse({
            success: response.success,
            message: response.message,
            data: {
                x: response.x,
                y: response.y,
            },
        });
    }
    async tapPercent(action) {
        const response = await this._grpcClient.tapPercent({
            xPercent: action.point.xPercent,
            yPercent: action.point.yPercent,
        });
        return this._toResponse(response);
    }
    async longPress(action) {
        const response = await this._grpcClient.tap({
            x: action.point.x,
            y: action.point.y,
            delay: 1500,
        });
        return this._toResponse(response);
    }
    async enterText(action) {
        const response = await this._grpcClient.enterText({
            value: action.value,
            shouldEraseText: action.shouldEraseText,
            eraseCount: action.eraseCount ?? undefined,
        });
        return this._toResponse(response);
    }
    async eraseText(_action) {
        return this._toResponse(await this._grpcClient.eraseText());
    }
    async swipe(action) {
        const response = await this._grpcClient.swipe({
            startX: action.startX,
            startY: action.startY,
            endX: action.endX,
            endY: action.endY,
            durationMs: action.durationMs,
        });
        return this._toResponse(response);
    }
    async back() {
        return this._toResponse(await this._grpcClient.back());
    }
    async home() {
        return this._toResponse(await this._grpcClient.home());
    }
    async rotate(_action) {
        const response = await this._grpcClient.rotate();
        return this._toResponse(response, {
            orientation: response.orientation,
        });
    }
    async hideKeyboard() {
        return this._toResponse(await this._grpcClient.hideKeyboard());
    }
    async pressKey(action) {
        return this._toResponse(await this._grpcClient.pressKey(action.key));
    }
    async launchApp(action) {
        const response = await this._grpcClient.launchApp({
            appUpload: { packageName: action.appUpload.packageName },
            allowAllPermissions: action.allowAllPermissions,
            shouldUninstallBeforeLaunch: action.shouldUninstallBeforeLaunch,
            arguments: Object.fromEntries(Object.entries(action.arguments ?? {}).map(([key, value]) => [
                key,
                {
                    type: value.type,
                    value: value.value,
                },
            ])),
            permissions: action.permissions,
        });
        return this._toResponse(response, {
            packageName: action.appUpload.packageName,
        });
    }
    async killApp(packageName) {
        return this._toResponse(await this._grpcClient.killApp(packageName));
    }
    async setLocation(action) {
        return this._toResponse(await this._grpcClient.setLocation(parseFloat(action.lat), parseFloat(action.long)));
    }
    async switchToPrimaryApp(action) {
        return this._toResponse(await this._grpcClient.switchToPrimaryApp(action.packageName));
    }
    async checkAppInForeground(action) {
        return this._toResponse(await this._grpcClient.checkAppInForeground(action.packageName, action.timeoutSeconds));
    }
    async captureState(traceStep) {
        return await this._captureCoordinator.capture(traceStep);
    }
    async getInstalledAppsFromDriver() {
        const response = await this._grpcClient.getAppList();
        return (response.apps ?? []).map((app) => new common_1.DeviceAppInfo({
            packageName: app.packageName,
            name: app.name,
            version: app.version ?? null,
        }));
    }
    async getInstalledAppsResponseFromDriver() {
        const apps = await this.getInstalledAppsFromDriver();
        return new common_1.DeviceNodeResponse({
            success: true,
            data: {
                apps: apps.map((app) => app.toJson()),
            },
        });
    }
    async getScreenshotAndHierarchy() {
        const response = await this._grpcClient.getScreenshotAndHierarchy();
        return {
            screenshot: response.screenshot,
            hierarchy: response.hierarchy,
            screenWidth: response.screenWidth,
            screenHeight: response.screenHeight,
            deviceTime: response.deviceTime,
            timezone: response.timezone,
        };
    }
    async getScreenshot(_action) {
        const response = await this._grpcClient.getScreenshot();
        return this._toResponse(response, this._toCaptureData(response));
    }
    async getHierarchy(_action) {
        const response = await this._grpcClient.getHierarchy();
        return this._toResponse(response, this._toCaptureData(response));
    }
    async updateAppIds(appIds) {
        return await this._grpcClient.updateAppIds(appIds);
    }
    close() {
        this._grpcClient.close();
    }
    killDriver() {
        this._grpcClient.close();
    }
    _toResponse(response, data) {
        return new common_1.DeviceNodeResponse({
            success: response.success,
            message: response.message,
            data,
        });
    }
    _toCaptureData(response) {
        return {
            screenshot: response.screenshot,
            hierarchy: response.hierarchy,
            screenWidth: response.screenWidth,
            screenHeight: response.screenHeight,
            deviceTime: response.deviceTime,
            timezone: response.timezone,
        };
    }
}
exports.CommonDriverActions = CommonDriverActions;
//# sourceMappingURL=CommonDriverActions.js.map