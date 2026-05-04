import { DeviceAppInfo, DeviceNodeResponse, EraseTextAction, EnterTextAction, GetHierarchyAction, GetScreenshotAction, LaunchAppAction, LongPressAction, PressKeyAction, RotateAction, ScrollAbsAction, SetLocationAction, SwitchToPrimaryAppAction, TapAction, TapPercentAction, CheckAppInForegroundAction } from '@usb-ui-test/common';
import { ScreenshotCaptureCoordinator } from '../../capture/ScreenshotCaptureCoordinator.js';
import type { GrpcResponse, GrpcDriverClient } from '../../grpc/GrpcDriverClient.js';
import { DeviceSession } from '../DeviceSession.js';
import type { DeviceScreenshotAndHierarchy } from './DeviceRuntime.js';
export declare class CommonDriverActions {
    private _grpcClient;
    private _session;
    private _captureCoordinator;
    constructor(params: {
        grpcClient: GrpcDriverClient;
        session?: DeviceSession;
        captureCoordinator?: ScreenshotCaptureCoordinator;
    });
    setShouldEnsureStability(shouldEnsureStability: boolean | undefined): void;
    isConnected(): boolean;
    tap(action: TapAction): Promise<DeviceNodeResponse>;
    tapPercent(action: TapPercentAction): Promise<DeviceNodeResponse>;
    longPress(action: LongPressAction): Promise<DeviceNodeResponse>;
    enterText(action: EnterTextAction): Promise<DeviceNodeResponse>;
    eraseText(_action: EraseTextAction): Promise<DeviceNodeResponse>;
    swipe(action: ScrollAbsAction): Promise<DeviceNodeResponse>;
    back(): Promise<DeviceNodeResponse>;
    home(): Promise<DeviceNodeResponse>;
    rotate(_action: RotateAction): Promise<DeviceNodeResponse>;
    hideKeyboard(): Promise<DeviceNodeResponse>;
    pressKey(action: PressKeyAction): Promise<DeviceNodeResponse>;
    launchApp(action: LaunchAppAction): Promise<DeviceNodeResponse>;
    killApp(packageName: string): Promise<DeviceNodeResponse>;
    setLocation(action: SetLocationAction): Promise<DeviceNodeResponse>;
    switchToPrimaryApp(action: SwitchToPrimaryAppAction): Promise<DeviceNodeResponse>;
    checkAppInForeground(action: CheckAppInForegroundAction): Promise<DeviceNodeResponse>;
    captureState(traceStep?: number | null): Promise<DeviceNodeResponse>;
    getInstalledAppsFromDriver(): Promise<DeviceAppInfo[]>;
    getInstalledAppsResponseFromDriver(): Promise<DeviceNodeResponse>;
    getScreenshotAndHierarchy(): Promise<DeviceScreenshotAndHierarchy>;
    getScreenshot(_action: GetScreenshotAction): Promise<DeviceNodeResponse>;
    getHierarchy(_action: GetHierarchyAction): Promise<DeviceNodeResponse>;
    updateAppIds(appIds: string[]): Promise<GrpcResponse>;
    close(): void;
    killDriver(): void;
    private _toResponse;
    private _toCaptureData;
}
//# sourceMappingURL=CommonDriverActions.d.ts.map