import { DeviceInfo, type FilePathUtil } from '@usb-ui-test/common';
import { type IOSDriverProcessHandle, type SimctlClient } from '../../infra/ios/SimctlClient.js';
import type { GrpcDriverClient } from '../GrpcDriverClient.js';
export declare class IOSSimulatorSetup {
    private _simctlClient;
    private _filePathUtil;
    private _connectWithPolling;
    private _captureReadinessTimeoutMs;
    private _captureReadinessDelayMs;
    private _killStaleHostProcessesOnPortFn;
    constructor(params: {
        simctlClient: SimctlClient;
        filePathUtil: FilePathUtil;
        connectWithPolling: (grpcClient: GrpcDriverClient, host: string, port: number, options?: {
            getStartupFailureMessage?: () => string | null;
            getWaitStatusMessage?: () => string | null;
            getTimeoutMessage?: () => string | null;
        }) => Promise<boolean>;
        captureReadinessTimeoutMs: number;
        captureReadinessDelayMs: number;
        killStaleHostProcessesOnPortFn?: (port: number) => Promise<void>;
    });
    prepare(deviceInfo: DeviceInfo, grpcClient: GrpcDriverClient): Promise<{
        deviceId: string;
        grpcPort: number;
        driverProcess: IOSDriverProcessHandle;
        restartDriver: () => Promise<IOSDriverProcessHandle>;
    }>;
    private _trackIOSDriverProcess;
    private _killStaleHostProcessesOnPort;
    private _updateIOSAppIds;
    private _formatWaitStatus;
}
//# sourceMappingURL=IOSSimulatorSetup.d.ts.map