"use strict";
// Singleton entry point for device management.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceNode = void 0;
const common_1 = require("@usb-ui-test/common");
const DeviceDiscoveryService_js_1 = require("./discovery/DeviceDiscoveryService.js");
const DevicePool_js_1 = require("./device/DevicePool.js");
const GrpcDriverSetup_js_1 = require("./grpc/GrpcDriverSetup.js");
const AdbClient_js_1 = require("./infra/android/AdbClient.js");
const SimctlClient_js_1 = require("./infra/ios/SimctlClient.js");
/**
 * Singleton manager for detecting, tracking, and providing access to connected devices.
 */
class DeviceNode {
    static _instance = null;
    _deviceDiscoveryService;
    _devicePool;
    _grpcDriverSetup = null;
    _initialized = false;
    _adbClient;
    _simctlClient;
    /**
     * Promise tracking the in-flight startup adb-forward cleanup. setUpDevice()
     * awaits this so removeAllPortForwards() can never wipe a freshly allocated
     * forward. Defaults to a resolved promise so callers that never run init()
     * (e.g., direct AdbClient tests) aren't blocked.
     */
    _initCleanupPromise = Promise.resolve();
    constructor() {
        this._deviceDiscoveryService = new DeviceDiscoveryService_js_1.DeviceDiscoveryService();
        this._devicePool = new DevicePool_js_1.DevicePool();
        this._adbClient = new AdbClient_js_1.AdbClient();
        this._simctlClient = new SimctlClient_js_1.SimctlClient();
    }
    /** Get the singleton instance. */
    static getInstance() {
        if (!DeviceNode._instance) {
            DeviceNode._instance = new DeviceNode();
        }
        return DeviceNode._instance;
    }
    /** Reset the singleton (for testing). */
    static resetInstance() {
        DeviceNode._instance = null;
    }
    /**
     * Initialize the device node with a file path utility.
     * Must be called before any other method.
     *
     * Also fires off a best-effort cleanup of any stale adb forwards left
     * behind by a previous device-node process. Without this, after a crash
     * or hard restart the in-memory port pool can drift away from the OS
     * state and cause "port already in use" errors.
     */
    init(filePathUtil) {
        this._grpcDriverSetup = new GrpcDriverSetup_js_1.GrpcDriverSetup({
            adbClient: this._adbClient,
            simctlClient: this._simctlClient,
            filePathUtil,
        });
        this._initialized = true;
        // Capture the cleanup as a promise. setUpDevice() awaits it before
        // running so removeAllPortForwards() (which clears the in-memory pool)
        // can never race with a freshly allocated forward.
        this._initCleanupPromise = this._cleanupStaleAdbForwards(filePathUtil);
    }
    async _cleanupStaleAdbForwards(filePathUtil) {
        try {
            const adbPath = await filePathUtil.getADBPath();
            if (!adbPath)
                return;
            await this._adbClient.removeAllPortForwards(adbPath);
        }
        catch {
            // best-effort
        }
    }
    /**
     * Detect all connected devices (Android + iOS).
     */
    async detectInventory(adbPath) {
        const inventory = await this._deviceDiscoveryService.detectInventory(adbPath);
        common_1.Logger.d(`Detected ${inventory.entries.length} target(s)`);
        return inventory;
    }
    async detectDevices(adbPath) {
        const inventory = await this.detectInventory(adbPath);
        return inventory.entries
            .filter((entry) => entry.runnable && entry.deviceInfo !== null)
            .map((entry) => entry.deviceInfo);
    }
    async startTarget(entry, adbPath) {
        return await this._deviceDiscoveryService.startTarget(entry, adbPath);
    }
    /**
     * Set up a device for execution: install driver, connect gRPC, add to pool.
     * Returns the fully set up Device instance.
     */
    async setUpDevice(deviceInfo) {
        if (!this._initialized || !this._grpcDriverSetup) {
            throw new Error('DeviceNode not initialized. Call init() first.');
        }
        // Wait for any in-flight startup cleanup before allocating a new
        // forward. removeAllPortForwards() clears the in-memory port pool,
        // which would otherwise wipe a freshly-created entry.
        await this._initCleanupPromise;
        const device = await this._grpcDriverSetup.setUp(deviceInfo);
        this._devicePool.add(device);
        return device;
    }
    /**
     * Get the first available device from the pool.
     */
    getFirstDevice() {
        return this._devicePool.getFirst();
    }
    /**
     * Get a specific device by ID.
     */
    getDevice(deviceId) {
        return this._devicePool.get(deviceId);
    }
    /**
     * Clean up — close all device connections.
     */
    async cleanup() {
        for (const device of this._devicePool.getAll()) {
            try {
                await device.closeConnection();
            }
            catch {
                // ignore cleanup errors
            }
        }
    }
    async installAndroidApp(adbPath, deviceId, appPath) {
        return await this._adbClient.installApp(adbPath, deviceId, appPath);
    }
    async installIOSApp(deviceId, appPath) {
        return await this._simctlClient.installApp(deviceId, appPath);
    }
}
exports.DeviceNode = DeviceNode;
//# sourceMappingURL=DeviceNode.js.map