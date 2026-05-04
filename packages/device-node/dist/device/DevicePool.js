"use strict";
// Port of device_node/lib/device/DevicePool.dart
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicePool = void 0;
/**
 * Simple pool of available Device instances.
 * Dart equivalent: DevicePool in device_node/lib/device/DevicePool.dart
 */
class DevicePool {
    _devices = new Map();
    /** Add a device to the pool. */
    add(device) {
        this._devices.set(device.getId(), device);
    }
    /** Remove a device from the pool. */
    remove(deviceId) {
        this._devices.delete(deviceId);
    }
    /** Get a device by ID. */
    get(deviceId) {
        return this._devices.get(deviceId);
    }
    /** Get the first available device (or undefined). */
    getFirst() {
        const first = this._devices.values().next();
        return first.done ? undefined : first.value;
    }
    /** Get all devices. */
    getAll() {
        return Array.from(this._devices.values());
    }
    /** Get the number of devices in the pool. */
    get size() {
        return this._devices.size;
    }
    /** Check if pool is empty. */
    get isEmpty() {
        return this._devices.size === 0;
    }
}
exports.DevicePool = DevicePool;
//# sourceMappingURL=DevicePool.js.map