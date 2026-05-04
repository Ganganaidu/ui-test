import type { FilePathUtil, DeviceInfo, DeviceInventoryDiagnostic, DeviceInventoryEntry, DeviceInventoryReport } from '@usb-ui-test/common';
import { Device } from './device/Device.js';
/**
 * Singleton manager for detecting, tracking, and providing access to connected devices.
 */
export declare class DeviceNode {
    private static _instance;
    private _deviceDiscoveryService;
    private _devicePool;
    private _grpcDriverSetup;
    private _initialized;
    private _adbClient;
    private _simctlClient;
    /**
     * Promise tracking the in-flight startup adb-forward cleanup. setUpDevice()
     * awaits this so removeAllPortForwards() can never wipe a freshly allocated
     * forward. Defaults to a resolved promise so callers that never run init()
     * (e.g., direct AdbClient tests) aren't blocked.
     */
    private _initCleanupPromise;
    private constructor();
    /** Get the singleton instance. */
    static getInstance(): DeviceNode;
    /** Reset the singleton (for testing). */
    static resetInstance(): void;
    /**
     * Initialize the device node with a file path utility.
     * Must be called before any other method.
     *
     * Also fires off a best-effort cleanup of any stale adb forwards left
     * behind by a previous device-node process. Without this, after a crash
     * or hard restart the in-memory port pool can drift away from the OS
     * state and cause "port already in use" errors.
     */
    init(filePathUtil: FilePathUtil): void;
    private _cleanupStaleAdbForwards;
    /**
     * Detect all connected devices (Android + iOS).
     */
    detectInventory(adbPath: string | null): Promise<DeviceInventoryReport>;
    detectDevices(adbPath: string | null): Promise<DeviceInfo[]>;
    startTarget(entry: DeviceInventoryEntry, adbPath: string | null): Promise<DeviceInventoryDiagnostic | null>;
    /**
     * Set up a device for execution: install driver, connect gRPC, add to pool.
     * Returns the fully set up Device instance.
     */
    setUpDevice(deviceInfo: DeviceInfo): Promise<Device>;
    /**
     * Get the first available device from the pool.
     */
    getFirstDevice(): Device | undefined;
    /**
     * Get a specific device by ID.
     */
    getDevice(deviceId: string): Device | undefined;
    /**
     * Clean up — close all device connections.
     */
    cleanup(): Promise<void>;
    installAndroidApp(adbPath: string, deviceId: string, appPath: string): Promise<boolean>;
    installIOSApp(deviceId: string, appPath: string): Promise<boolean>;
}
//# sourceMappingURL=DeviceNode.d.ts.map