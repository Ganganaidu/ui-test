import { Device } from './Device.js';
/**
 * Simple pool of available Device instances.
 * Dart equivalent: DevicePool in device_node/lib/device/DevicePool.dart
 */
export declare class DevicePool {
    private _devices;
    /** Add a device to the pool. */
    add(device: Device): void;
    /** Remove a device from the pool. */
    remove(deviceId: string): void;
    /** Get a device by ID. */
    get(deviceId: string): Device | undefined;
    /** Get the first available device (or undefined). */
    getFirst(): Device | undefined;
    /** Get all devices. */
    getAll(): Device[];
    /** Get the number of devices in the pool. */
    get size(): number;
    /** Check if pool is empty. */
    get isEmpty(): boolean;
}
//# sourceMappingURL=DevicePool.d.ts.map