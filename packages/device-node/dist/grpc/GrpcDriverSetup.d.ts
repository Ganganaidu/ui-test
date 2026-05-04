import { DeviceInfo } from '@usb-ui-test/common';
import type { FilePathUtil } from '@usb-ui-test/common';
import { Device } from '../device/Device.js';
import { AdbClient } from '../infra/android/AdbClient.js';
import { SimctlClient } from '../infra/ios/SimctlClient.js';
import { GrpcDriverClient } from './GrpcDriverClient.js';
import { type AndroidDriverProcessHandle } from './setup/AndroidDeviceSetup.js';
/**
 * Sets up the gRPC connection to a device's driver app.
 * Flow: install driver -> connect gRPC -> return a wrapped platform runtime.
 *
 * Dart equivalent: GrpcDriverSetup in device_node/lib/device/GrpcDriverSetup.dart
 */
export declare class GrpcDriverSetup {
    private _adbClient;
    private _simctlClient;
    private _filePathUtil;
    private _grpcClientFactory;
    private _delayFn;
    private _captureReadinessTimeoutMs;
    private _captureReadinessDelayMs;
    private _killStaleHostProcessesOnPortFn;
    private _startAndroidDriverFn;
    private _androidDeviceSetup;
    private _iosSimulatorSetup;
    constructor(params: {
        adbClient: AdbClient;
        simctlClient: SimctlClient;
        filePathUtil: FilePathUtil;
        grpcClientFactory?: () => GrpcDriverClient;
        delayFn?: (ms: number) => Promise<void>;
        captureReadinessTimeoutMs?: number;
        captureReadinessDelayMs?: number;
        killStaleHostProcessesOnPortFn?: (port: number) => Promise<void>;
        startAndroidDriverFn?: (adbPath: string, deviceSerial: string, port: number) => AndroidDriverProcessHandle;
    });
    setUp(deviceInfo: DeviceInfo): Promise<Device>;
    private _createRuntime;
    /**
     * Connects to the gRPC server with polling.
     * Matches Dart: creates channel once, then polls with ping().
     * 240 attempts x 500ms = 120 seconds total timeout.
     */
    private _connectWithPolling;
    private _startAndroidDriver;
    private _delay;
    private _killStaleHostProcessesOnPort;
}
//# sourceMappingURL=GrpcDriverSetup.d.ts.map