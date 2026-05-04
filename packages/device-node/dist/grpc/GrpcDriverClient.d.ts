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
export declare class GrpcDriverClient {
    private _client;
    private _connected;
    get isConnected(): boolean;
    /**
     * Creates the gRPC channel WITHOUT verifying connectivity.
     * This is a lazy operation — no network call is made until the first RPC.
     * Use ping() to verify the server is reachable.
     *
     * Dart: void createChannel(String host, int port)
     */
    createChannel(host: string, port: number): void;
    /**
     * Pings the gRPC server to verify connectivity.
     * Calls getDeviceScale with a 3s timeout (matches Dart).
     * Returns true if the server responds, false otherwise.
     *
     * Dart: Future<bool> ping()
     */
    ping(): Promise<boolean>;
    /**
     * Connect to the gRPC server: createChannel + verify with ping.
     * For polling-style connection (during driver startup), use
     * createChannel() + loop { ping() } instead.
     *
     * Dart: Future<bool> connect(String host, int port)
     */
    connect(host: string, port: number): Promise<boolean>;
    /**
     * Close the gRPC connection.
     */
    close(): void;
    /** Tap at absolute coordinates. */
    tap(params: {
        x: number;
        y: number;
        repeat?: number;
        delay?: number;
    }): Promise<GrpcResponse>;
    /** Tap at percentage coordinates. */
    tapPercent(params: {
        xPercent: number;
        yPercent: number;
    }): Promise<GrpcResponse>;
    /** Enter text into the focused input field. */
    enterText(params: {
        value: string;
        shouldEraseText?: boolean;
        eraseCount?: number;
    }): Promise<GrpcResponse>;
    /** Erase text from the focused field. */
    eraseText(): Promise<GrpcResponse>;
    /** Copy text. */
    copyText(): Promise<GrpcResponse>;
    /** Paste text. */
    pasteText(): Promise<GrpcResponse>;
    /** Press system Back button. */
    back(): Promise<GrpcResponse>;
    /** Press system Home button. */
    home(): Promise<GrpcResponse>;
    /** Rotate device. */
    rotate(): Promise<GrpcRotateResponse>;
    /** Hide keyboard. */
    hideKeyboard(): Promise<GrpcResponse>;
    /** Press a named key. */
    pressKey(key: string): Promise<GrpcResponse>;
    /** Swipe from (startX, startY) to (endX, endY). */
    swipe(params: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        durationMs: number;
    }): Promise<GrpcResponse>;
    /** Launch an app. */
    launchApp(params: {
        appUpload: {
            packageName: string;
        };
        allowAllPermissions: boolean;
        arguments?: Record<string, {
            type: string;
            value: string;
        }>;
        permissions?: Record<string, string>;
        shouldUninstallBeforeLaunch?: boolean;
    }): Promise<GrpcResponse>;
    /** Kill a running app. */
    killApp(packageName: string): Promise<GrpcResponse>;
    /** Switch to primary app. */
    switchToPrimaryApp(packageName: string): Promise<GrpcResponse>;
    /** Check if app is in foreground. */
    checkAppInForeground(packageName: string, timeoutSeconds: number): Promise<GrpcResponse>;
    /** Get list of installed apps. */
    getAppList(): Promise<GrpcAppListResponse>;
    /** Update app IDs. */
    updateAppIds(appIds: string[]): Promise<GrpcResponse>;
    /** Get device scale factor. */
    getDeviceScale(): Promise<GrpcDeviceScaleResponse>;
    /** Get screen dimensions. */
    getScreenDimension(): Promise<GrpcScreenDimensionResponse>;
    /** Set device GPS location. */
    setLocation(latitude: number, longitude: number): Promise<GrpcResponse>;
    /** Get a screenshot (base64 encoded). */
    getScreenshot(quality?: number, options?: UnaryCallOptions): Promise<GrpcScreenshotResponse>;
    /** Get the UI hierarchy. */
    getHierarchy(options?: UnaryCallOptions): Promise<GrpcScreenshotResponse>;
    /** Get screenshot AND hierarchy in one call (most commonly used). */
    getScreenshotAndHierarchy(quality?: number, options?: UnaryCallOptions): Promise<GrpcScreenshotResponse>;
    /** Get raw screenshot bytes (for stability comparison). */
    getRawScreenshot(quality?: number, options?: UnaryCallOptions): Promise<GrpcRawScreenshotResponse>;
    /** Stop execution on device. */
    stopExecution(): Promise<GrpcResponse>;
    /**
     * Make a unary gRPC call with optional retry.
     * Retries up to `maxRetries` times on any error, with linear backoff.
     * Default is 0 (no retry) to prevent duplicating mutating actions.
     * Read-only RPCs opt in with `maxRetries: 2`.
     */
    private _unaryCall;
    /**
     * Single unary gRPC call converting callback style → Promise.
     * @param timeoutMs — RPC timeout in milliseconds (default 30s, matches Dart _callOptions)
     */
    private _singleCall;
}
export interface GrpcResponse {
    success: boolean;
    message?: string;
}
export interface GrpcScreenshotResponse extends GrpcResponse {
    screenshot?: string;
    screenWidth: number;
    screenHeight: number;
    hierarchy?: string;
    deviceTime?: string;
    timezone?: string;
}
export interface GrpcRawScreenshotResponse extends GrpcResponse {
    screenshot?: Buffer;
    screenWidth: number;
    screenHeight: number;
}
export interface GrpcRotateResponse extends GrpcResponse {
    orientation: string;
}
export interface GrpcAppListResponse extends GrpcResponse {
    apps: Array<{
        packageName: string;
        name: string;
        version?: string;
    }>;
}
export interface GrpcDeviceScaleResponse extends GrpcResponse {
    scale: number;
}
export interface GrpcScreenDimensionResponse extends GrpcResponse {
    screenWidth: number;
    screenHeight: number;
}
export interface UnaryCallOptions {
    timeoutMs?: number;
    errorLogLevel?: 'error' | 'debug' | 'silent';
    /** Max retries on error (default 0 — no retry for mutating RPCs). Read-only RPCs opt in explicitly. */
    maxRetries?: number;
    /** Base delay between retries in ms (default 500). Scales linearly: delay * (attempt + 1). */
    retryDelayMs?: number;
}
//# sourceMappingURL=GrpcDriverClient.d.ts.map