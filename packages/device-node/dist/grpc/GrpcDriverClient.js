"use strict";
// Port of device_node/lib/driver/GrpcDriverClient.dart
// Uses @grpc/grpc-js with dynamic proto loading.
// MATCHES the Dart pattern: createChannel (lazy) → ping (getDeviceScale) → poll
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
exports.GrpcDriverClient = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("path"));
const common_1 = require("@usb-ui-test/common");
function resolveProtoPath() {
    const candidates = [
        process.env['USB_UI_TEST_DRIVER_PROTO_PATH'],
        path.resolve(__dirname, '../../proto/usbuitest/driver.proto'),
        path.resolve(__dirname, '../../../../proto/usbuitest/driver.proto'),
    ].filter((candidate) => Boolean(candidate));
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    throw new Error(`UsbUiTest driver.proto not found. Searched: ${candidates.join(', ')}`);
}
/**
 * gRPC client for communicating with the on-device driver app.
 *
 * Connection pattern (matches Dart):
 *   1. createChannel(host, port) — lazy, no network call
 *   2. ping() — verifies connectivity via getDeviceScale RPC (3s timeout)
 *   3. connect(host, port) — createChannel + single ping verification
 *
 * For startup polling, use createChannel() + loop { ping() } like Dart does.
 *
 * Dart equivalent: GrpcDriverClient in device_node/lib/driver/GrpcDriverClient.dart
 */
class GrpcDriverClient {
    _client = null;
    _connected = false;
    get isConnected() {
        return this._connected;
    }
    /**
     * Creates the gRPC channel WITHOUT verifying connectivity.
     * This is a lazy operation — no network call is made until the first RPC.
     * Use ping() to verify the server is reachable.
     *
     * Dart: void createChannel(String host, int port)
     */
    createChannel(host, port) {
        common_1.Logger.d(`GrpcDriverClient: Creating channel to ${host}:${port}`);
        const packageDefinition = protoLoader.loadSync(resolveProtoPath(), {
            keepCase: false, // CamelCase → camelCase
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const driverService = protoDescriptor.usbuitest.driver.DriverService;
        this._client = new driverService(`${host}:${port}`, grpc.credentials.createInsecure(), {
            'grpc.keepalive_time_ms': 10000,
            'grpc.keepalive_timeout_ms': 5000,
        });
        common_1.Logger.d('GrpcDriverClient: Channel created');
    }
    /**
     * Pings the gRPC server to verify connectivity.
     * Calls getDeviceScale with a 3s timeout (matches Dart).
     * Returns true if the server responds, false otherwise.
     *
     * Dart: Future<bool> ping()
     */
    async ping() {
        if (!this._client) {
            common_1.Logger.d('GrpcDriverClient: Cannot ping - no channel');
            return false;
        }
        try {
            const response = await this._unaryCall('getDeviceScale', {}, {
                timeoutMs: 3000,
                errorLogLevel: 'debug',
                maxRetries: 2,
            });
            this._connected = true;
            common_1.Logger.d(`GrpcDriverClient: Ping successful, scale=${response?.scale}`);
            return true;
        }
        catch {
            // Ping failed — expected during startup
            return false;
        }
    }
    /**
     * Connect to the gRPC server: createChannel + verify with ping.
     * For polling-style connection (during driver startup), use
     * createChannel() + loop { ping() } instead.
     *
     * Dart: Future<bool> connect(String host, int port)
     */
    async connect(host, port) {
        try {
            this.createChannel(host, port);
            common_1.Logger.d('GrpcDriverClient: Verifying connection with ping...');
            if (!await this.ping()) {
                common_1.Logger.e('GrpcDriverClient: Connection verification failed');
                this.close();
                return false;
            }
            common_1.Logger.i(`GrpcDriverClient: Successfully connected to ${host}:${port}`);
            return true;
        }
        catch (e) {
            common_1.Logger.e('GrpcDriverClient: Failed to connect:', e);
            this._connected = false;
            return false;
        }
    }
    /**
     * Close the gRPC connection.
     */
    close() {
        if (this._client) {
            this._client.close();
            this._client = null;
            this._connected = false;
        }
    }
    // ==========================================================================
    // RPC Methods — each wraps the generated client method with Promise
    // ==========================================================================
    /** Tap at absolute coordinates. */
    async tap(params) {
        return this._unaryCall('tap', {
            point: { x: params.x, y: params.y },
            repeat: params.repeat ?? 1,
            delay: params.delay ?? 0,
        });
    }
    /** Tap at percentage coordinates. */
    async tapPercent(params) {
        return this._unaryCall('tapPercent', {
            point: { xPercent: params.xPercent, yPercent: params.yPercent },
        });
    }
    /** Enter text into the focused input field. */
    async enterText(params) {
        return this._unaryCall('enterText', {
            value: params.value,
            shouldEraseText: params.shouldEraseText ?? false,
            eraseCount: params.eraseCount,
        });
    }
    /** Erase text from the focused field. */
    async eraseText() {
        return this._unaryCall('eraseText', {});
    }
    /** Copy text. */
    async copyText() {
        return this._unaryCall('copyText', {});
    }
    /** Paste text. */
    async pasteText() {
        return this._unaryCall('pasteText', {});
    }
    /** Press system Back button. */
    async back() {
        return this._unaryCall('back', {});
    }
    /** Press system Home button. */
    async home() {
        return this._unaryCall('home', {});
    }
    /** Rotate device. */
    async rotate() {
        return this._unaryCall('rotate', {});
    }
    /** Hide keyboard. */
    async hideKeyboard() {
        return this._unaryCall('hideKeyboard', {});
    }
    /** Press a named key. */
    async pressKey(key) {
        return this._unaryCall('pressKey', { key });
    }
    /** Swipe from (startX, startY) to (endX, endY). */
    async swipe(params) {
        return this._unaryCall('swipe', params);
    }
    /** Launch an app. */
    async launchApp(params) {
        return this._unaryCall('launchApp', params, { timeoutMs: 60000, maxRetries: 2 }); // 60s timeout like Dart; retries enable driver recovery on iOS
    }
    /** Kill a running app. */
    async killApp(packageName) {
        return this._unaryCall('killApp', { packageName });
    }
    /** Switch to primary app. */
    async switchToPrimaryApp(packageName) {
        return this._unaryCall('switchToPrimaryApp', { packageName });
    }
    /** Check if app is in foreground. */
    async checkAppInForeground(packageName, timeoutSeconds) {
        return this._unaryCall('checkAppInForeground', { packageName, timeoutSeconds }, {
            timeoutMs: (timeoutSeconds + 5) * 1000,
            maxRetries: 2,
        });
    }
    /** Get list of installed apps. */
    async getAppList() {
        return this._unaryCall('getAppList', {}, { maxRetries: 2 });
    }
    /** Update app IDs. */
    async updateAppIds(appIds) {
        return this._unaryCall('updateAppIds', { appIds }, { maxRetries: 2 });
    }
    /** Get device scale factor. */
    async getDeviceScale() {
        return this._unaryCall('getDeviceScale', {}, { maxRetries: 2 });
    }
    /** Get screen dimensions. */
    async getScreenDimension() {
        return this._unaryCall('getScreenDimension', {}, { maxRetries: 2 });
    }
    /** Set device GPS location. */
    async setLocation(latitude, longitude) {
        return this._unaryCall('setLocation', { latitude, longitude });
    }
    /** Get a screenshot (base64 encoded). */
    async getScreenshot(quality, options) {
        return this._unaryCall('getScreenshot', { quality: quality ?? 5 }, {
            ...options,
            maxRetries: 0, // ScreenshotCapture has its own retry
        });
    }
    /** Get the UI hierarchy. */
    async getHierarchy(options) {
        return this._unaryCall('getHierarchy', {}, {
            ...options,
            maxRetries: 0, // ScreenshotCapture has its own retry
        });
    }
    /** Get screenshot AND hierarchy in one call (most commonly used). */
    async getScreenshotAndHierarchy(quality, options) {
        return this._unaryCall('getScreenshotAndHierarchy', {
            quality: quality ?? 5,
        }, {
            timeoutMs: options?.timeoutMs ?? 60000,
            errorLogLevel: options?.errorLogLevel,
            maxRetries: 0, // ScreenshotCapture has its own retry
        }); // 60s timeout like Dart
    }
    /** Get raw screenshot bytes (for stability comparison). */
    async getRawScreenshot(quality, options) {
        return this._unaryCall('getRawScreenshot', {
            quality: quality ?? 5,
        }, {
            ...options,
            maxRetries: 0, // ScreenshotCapture has its own retry
        });
    }
    /** Stop execution on device. */
    async stopExecution() {
        return this._unaryCall('stopExecution', {});
    }
    // ==========================================================================
    // Private helper
    // ==========================================================================
    /**
     * Make a unary gRPC call with optional retry.
     * Retries up to `maxRetries` times on any error, with linear backoff.
     * Default is 0 (no retry) to prevent duplicating mutating actions.
     * Read-only RPCs opt in with `maxRetries: 2`.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async _unaryCall(method, request, options) {
        const maxRetries = options?.maxRetries ?? 0;
        const retryDelayMs = options?.retryDelayMs ?? 500;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await this._singleCall(method, request, options);
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries)
                    throw error;
                common_1.Logger.d(`gRPC ${method}: error on attempt ${attempt + 1}/${maxRetries + 1}, retrying in ${retryDelayMs * (attempt + 1)}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
            }
        }
        throw lastError;
    }
    /**
     * Single unary gRPC call converting callback style → Promise.
     * @param timeoutMs — RPC timeout in milliseconds (default 30s, matches Dart _callOptions)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _singleCall(method, request, options) {
        return new Promise((resolve, reject) => {
            if (!this._client) {
                reject(new Error('gRPC client not connected'));
                return;
            }
            const timeoutMs = options?.timeoutMs ?? 30000;
            const deadline = new Date(Date.now() + timeoutMs);
            const metadata = new grpc.Metadata();
            // Dynamic method call on the gRPC client
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this._client[method](request, metadata, { deadline }, (err, response) => {
                if (err) {
                    switch (options?.errorLogLevel ?? 'error') {
                        case 'silent':
                            break;
                        case 'debug':
                            common_1.Logger.d(`gRPC ${method} failed: ${err.message}`);
                            break;
                        default:
                            common_1.Logger.e(`gRPC ${method} failed:`, err);
                            break;
                    }
                    reject(err);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
}
exports.GrpcDriverClient = GrpcDriverClient;
//# sourceMappingURL=GrpcDriverClient.js.map