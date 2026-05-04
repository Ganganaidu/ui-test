"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const DeviceSession_js_1 = require("./DeviceSession.js");
const ScreenshotCapture_js_1 = require("./ScreenshotCapture.js");
class FakeGrpcClient {
    captureCalls = 0;
    rawScreenshotCalls = 0;
    captureResponses;
    rawScreenshotResponses;
    constructor(params) {
        this.captureResponses = params?.captureResponses ?? [];
        this.rawScreenshotResponses = params?.rawScreenshotResponses ?? [];
    }
    async getScreenshotAndHierarchy() {
        this.captureCalls += 1;
        const next = this.captureResponses.shift() ??
            new Error('No capture response configured');
        if (next instanceof Error) {
            throw next;
        }
        return next;
    }
    async getRawScreenshot() {
        this.rawScreenshotCalls += 1;
        const next = this.rawScreenshotResponses.shift() ??
            new Error('No raw screenshot response configured');
        if (next instanceof Error) {
            throw next;
        }
        return next;
    }
}
(0, node_test_1.default)('isTransientCaptureFailureMessage matches UiAutomation-adjacent NPE variants', () => {
    // The Android driver's stale-binding failures surface either as the clean
    // "UiAutomation not connected" message or as a JVM NPE from framework code.
    // Both shapes need to count as transient so `waitForCaptureReadiness` gets
    // to retry inside its window instead of bailing on the first poll.
    strict_1.default.equal((0, ScreenshotCapture_js_1.isTransientCaptureFailureMessage)("Attempt to invoke virtual method 'java.lang.Class java.lang.Object.getClass()' on a null object reference"), true);
    strict_1.default.equal((0, ScreenshotCapture_js_1.isTransientCaptureFailureMessage)('java.lang.NullPointerException: Attempt to read from field ...'), true);
    strict_1.default.equal((0, ScreenshotCapture_js_1.isTransientCaptureFailureMessage)('Invalid hierarchy JSON from driver'), true);
    strict_1.default.equal((0, ScreenshotCapture_js_1.isTransientCaptureFailureMessage)('device offline'), false);
});
(0, node_test_1.default)('ScreenshotCaptureHelper retries transient failures when stability is disabled', async () => {
    const session = new DeviceSession_js_1.DeviceSession();
    session.setShouldEnsureStability(false);
    const grpcClient = new FakeGrpcClient({
        captureResponses: [
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
            { success: false, message: 'UiAutomation not connected', screenWidth: 0, screenHeight: 0 },
            {
                success: true,
                screenshot: 'base64-image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        ],
    });
    const helper = new ScreenshotCapture_js_1.ScreenshotCaptureHelper({
        grpcClient: grpcClient,
        session,
    });
    const response = await helper.capture();
    const captureTrace = response.data?.['captureTrace'];
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(grpcClient.captureCalls, 3);
    strict_1.default.equal(response.data?.['screenshot'], 'base64-image');
    strict_1.default.equal(response.data?.['screenWidth'], 1080);
    strict_1.default.equal(captureTrace['attempts'], 3);
    strict_1.default.equal(captureTrace['stable'], false);
    strict_1.default.equal(captureTrace['pollCount'], 0);
    strict_1.default.equal(typeof captureTrace['totalMs'], 'number');
    strict_1.default.equal(typeof captureTrace['finalPayloadMs'], 'number');
});
(0, node_test_1.default)('ScreenshotCaptureHelper waits for stable raw screenshots before final capture', async () => {
    const session = new DeviceSession_js_1.DeviceSession();
    session.setShouldEnsureStability(true);
    const grpcClient = new FakeGrpcClient({
        rawScreenshotResponses: [
            {
                success: true,
                screenshot: Buffer.from('frame-a'),
                screenWidth: 1080,
                screenHeight: 2400,
            },
            {
                success: true,
                screenshot: Buffer.from('frame-a'),
                screenWidth: 1080,
                screenHeight: 2400,
            },
        ],
        captureResponses: [
            {
                success: true,
                screenshot: 'stable-image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        ],
    });
    const helper = new ScreenshotCapture_js_1.ScreenshotCaptureHelper({
        grpcClient: grpcClient,
        session,
    });
    const response = await helper.capture();
    const captureTrace = response.data?.['captureTrace'];
    strict_1.default.equal(response.success, true);
    strict_1.default.equal(grpcClient.rawScreenshotCalls, 2);
    strict_1.default.equal(grpcClient.captureCalls, 1);
    strict_1.default.equal(response.data?.['screenshot'], 'stable-image');
    strict_1.default.equal(captureTrace['attempts'], 1);
    strict_1.default.equal(captureTrace['stable'], true);
    strict_1.default.equal(captureTrace['pollCount'], 2);
    strict_1.default.equal(typeof captureTrace['stabilityMs'], 'number');
    strict_1.default.equal(typeof captureTrace['finalPayloadMs'], 'number');
});
(0, node_test_1.default)('ScreenshotCaptureHelper exhausts retries on invalid hierarchy payloads', async () => {
    const session = new DeviceSession_js_1.DeviceSession();
    session.setShouldEnsureStability(false);
    const grpcClient = new FakeGrpcClient({
        captureResponses: [
            {
                success: true,
                screenshot: 'base64-image',
                hierarchy: 'not-json',
                screenWidth: 1080,
                screenHeight: 2400,
            },
            {
                success: true,
                screenshot: 'base64-image',
                hierarchy: 'not-json',
                screenWidth: 1080,
                screenHeight: 2400,
            },
            {
                success: true,
                screenshot: 'base64-image',
                hierarchy: 'not-json',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        ],
    });
    const helper = new ScreenshotCapture_js_1.ScreenshotCaptureHelper({
        grpcClient: grpcClient,
        session,
    });
    const response = await helper.capture();
    const captureTrace = response.data?.['captureTrace'];
    strict_1.default.equal(response.success, false);
    strict_1.default.equal(response.message, 'Invalid hierarchy JSON from driver');
    strict_1.default.equal(grpcClient.captureCalls, 3);
    strict_1.default.equal(captureTrace['attempts'], 3);
    strict_1.default.equal(captureTrace['failureReason'], 'Invalid hierarchy JSON from driver');
    strict_1.default.equal(typeof captureTrace['totalMs'], 'number');
});
//# sourceMappingURL=ScreenshotCapture.test.js.map