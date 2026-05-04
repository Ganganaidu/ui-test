"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotCaptureCoordinator = void 0;
exports.waitForDriverCaptureReadiness = waitForDriverCaptureReadiness;
const ScreenshotCapture_js_1 = require("../device/ScreenshotCapture.js");
class ScreenshotCaptureCoordinator {
    _helper;
    constructor(params) {
        this._helper = new ScreenshotCapture_js_1.ScreenshotCaptureHelper({
            grpcClient: params.grpcClient,
            session: params.session,
        });
    }
    async capture(traceStep) {
        return await this._helper.capture(traceStep);
    }
}
exports.ScreenshotCaptureCoordinator = ScreenshotCaptureCoordinator;
async function waitForDriverCaptureReadiness(grpcClient, options) {
    return await (0, ScreenshotCapture_js_1.waitForCaptureReadiness)(grpcClient, options);
}
//# sourceMappingURL=ScreenshotCaptureCoordinator.js.map