import { DeviceActionRequest } from '../models/DeviceActionRequest.js';
import { DeviceInfo } from '../models/DeviceInfo.js';
import { DeviceNodeResponse } from '../models/DeviceNodeResponse.js';
import type { RecordingRequest } from '../models/RecordingRequest.js';
/**
 * Abstract interface for anything that represents a connected device.
 * Implemented by Device in @usb-ui-test/device-node.
 *
 * Dart equivalent: common/interface/Agent.dart
 */
export interface DeviceAgent {
    setUp(options?: {
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
    logCaptureCleanUp(): Promise<void>;
    abortLogCapture(runId: string, keepOutput?: boolean): Promise<void>;
    uninstallDriver(): void;
}
//# sourceMappingURL=DeviceAgent.d.ts.map