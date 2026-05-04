import { spawn } from 'child_process';
import { DeviceInfo, type DeviceInventoryDiagnostic, type DeviceInventoryEntry, type DeviceInventoryReport } from '@usb-ui-test/common';
type ExecFileFn = (file: string, args: readonly string[]) => Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
}>;
type ReadFileFn = (filePath: string, encoding: BufferEncoding) => Promise<string>;
type DelayFn = (ms: number) => Promise<void>;
export declare class DeviceDiscoveryService {
    static readonly STARTUP_TIMEOUT_MS = 120000;
    static readonly POLL_INTERVAL_MS = 1500;
    static readonly ANDROID_LAUNCH_SETTLE_MS = 1000;
    private readonly _execFileFn;
    private readonly _spawnFn;
    private readonly _delayFn;
    private readonly _readFileFn;
    private readonly _fileExistsFn;
    private readonly _env;
    private readonly _homeDir;
    constructor(params?: {
        execFileFn?: ExecFileFn;
        spawnFn?: typeof spawn;
        delayFn?: DelayFn;
        readFileFn?: ReadFileFn;
        fileExistsFn?: (filePath: string) => boolean;
        env?: NodeJS.ProcessEnv;
        homeDir?: string;
    });
    getAndroidDevices(adbPath: string): Promise<DeviceInfo[]>;
    getIOSDevices(): Promise<DeviceInfo[]>;
    detectInventory(adbPath: string | null): Promise<DeviceInventoryReport>;
    startTarget(entry: DeviceInventoryEntry, adbPath: string | null): Promise<DeviceInventoryDiagnostic | null>;
    private _probeAndroidConnected;
    private _probeAndroidTargets;
    private _probeIOSSimulators;
    private _startIOSSimulator;
    private _startAndroidEmulator;
    private _waitForStartableEntry;
    private _loadAndroidConnectedDetails;
    private _loadAvdManagerRecords;
    private _loadAvdMetadata;
    private _runAndroidProperty;
    private _runCommand;
    private _resolveAndroidToolPath;
    private _parseAvdManagerList;
    private _parseIni;
    private _parseIOSRuntimeLabel;
    private _parseInlineAdbField;
    private _parseAdbDeviceLine;
    private _parseAvdNameOutput;
    private _normalizeLabel;
    private _formatAndroidOsLabel;
    private _formatAndroidDisplayName;
    private _formatIOSDisplayName;
    private _formatCommand;
    private _getAvdHome;
}
export {};
//# sourceMappingURL=DeviceDiscoveryService.d.ts.map