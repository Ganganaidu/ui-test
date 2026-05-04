import { DeviceAgent, DeviceActionRequest, DeviceInfo, DeviceNodeResponse, DeviceAppInfo, type RecordingRequest, TapAction, EnterTextAction, ScrollAbsAction, LaunchAppAction } from '@usb-ui-test/common';
import { type DeviceRecordingController } from './RecordingManager.js';
import { type DeviceLogCaptureController } from './LogCaptureManager.js';
import type { DeviceRuntime } from './shared/DeviceRuntime.js';
/**
 * Represents a single connected device and implements the DeviceAgent interface.
 * Bridges DeviceActionRequest -> runtime capability methods.
 *
 * Dart equivalent: Device in device_node/lib/device/Device.dart
 */
export declare class Device implements DeviceAgent {
    private _deviceInfo;
    private _runtime;
    private _apiKey;
    private _disconnectionCallback;
    private _recordingController;
    private _logCaptureController;
    constructor(params: {
        deviceInfo: DeviceInfo;
        runtime: DeviceRuntime;
        recordingController?: DeviceRecordingController;
        logCaptureController?: DeviceLogCaptureController;
    });
    setUp(_options?: {
        reuseAddress?: boolean;
    }): Promise<DeviceNodeResponse>;
    executeAction(request: DeviceActionRequest): Promise<DeviceNodeResponse>;
    isConnected(): boolean;
    getDeviceInfo(): DeviceInfo;
    closeConnection(): Promise<void>;
    killDriver(): void;
    setApiKey(apiKey: string): void;
    getId(): string;
    listenForDeviceDisconnection(callbacks: {
        onDeviceDisconnected: (deviceUUID: string, reason: string) => void;
    }): void;
    clearListener(): void;
    startRecording(recordingRequest: RecordingRequest): Promise<DeviceNodeResponse>;
    stopRecording(runId: string, testId: string): Promise<DeviceNodeResponse>;
    recordingCleanUp(): Promise<void>;
    abortRecording(runId: string, keepOutput?: boolean): Promise<void>;
    startLogCapture(request: {
        runId: string;
        testId: string;
        appIdentifier?: string;
    }): Promise<DeviceNodeResponse>;
    stopLogCapture(runId: string, testId: string): Promise<DeviceNodeResponse>;
    abortLogCapture(runId: string, keepOutput?: boolean): Promise<void>;
    logCaptureCleanUp(): Promise<void>;
    uninstallDriver(): void;
    tap(action: TapAction): Promise<DeviceNodeResponse>;
    enterText(action: EnterTextAction): Promise<DeviceNodeResponse>;
    scrollAbs(action: ScrollAbsAction): Promise<DeviceNodeResponse>;
    launchApp(action: LaunchAppAction): Promise<DeviceNodeResponse>;
    getScreenshotAndHierarchy(): Promise<{
        screenshot: string | undefined;
        hierarchy: string | undefined;
        screenWidth: number;
        screenHeight: number;
    }>;
    getInstalledApps(): Promise<DeviceAppInfo[]>;
}
//# sourceMappingURL=Device.d.ts.map