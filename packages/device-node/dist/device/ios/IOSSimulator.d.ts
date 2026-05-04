import { DeviceNodeResponse, type BackAction, type CheckAppInForegroundAction, type DeeplinkAction, type DeviceAppInfo, type EraseTextAction, type EnterTextAction, type GetHierarchyAction, type GetScreenshotAction, type HideKeyboardAction, type HomeAction, type KillAppAction, type LaunchAppAction, type LongPressAction, type PressKeyAction, type RotateAction, type ScrollAbsAction, type SetLocationAction, type SwitchToPrimaryAppAction, type TapAction, type TapPercentAction } from '@usb-ui-test/common';
import { type IOSDriverProcessHandle, type SimctlClient } from '../../infra/ios/SimctlClient.js';
import { CommonDriverActions } from '../shared/CommonDriverActions.js';
import type { DeviceRuntime, DeviceScreenshotAndHierarchy } from '../shared/DeviceRuntime.js';
export declare class IOSSimulator implements DeviceRuntime {
    private _commonDriverActions;
    private _simctlClient;
    private _deviceId;
    private _driverProcess;
    private _restartDriverFn;
    constructor(params: {
        commonDriverActions: CommonDriverActions;
        simctlClient: SimctlClient;
        deviceId: string;
        driverProcess: IOSDriverProcessHandle;
        restartDriver: () => Promise<IOSDriverProcessHandle>;
    });
    setShouldEnsureStability(shouldEnsureStability: boolean | undefined): void;
    isConnected(): boolean;
    tap(action: TapAction): Promise<DeviceNodeResponse>;
    tapPercent(action: TapPercentAction): Promise<DeviceNodeResponse>;
    longPress(action: LongPressAction): Promise<DeviceNodeResponse>;
    enterText(action: EnterTextAction): Promise<DeviceNodeResponse>;
    eraseText(action: EraseTextAction): Promise<DeviceNodeResponse>;
    scrollAbs(action: ScrollAbsAction): Promise<DeviceNodeResponse>;
    back(_action: BackAction): Promise<DeviceNodeResponse>;
    home(_action: HomeAction): Promise<DeviceNodeResponse>;
    rotate(action: RotateAction): Promise<DeviceNodeResponse>;
    hideKeyboard(_action: HideKeyboardAction): Promise<DeviceNodeResponse>;
    pressKey(action: PressKeyAction): Promise<DeviceNodeResponse>;
    launchApp(action: LaunchAppAction): Promise<DeviceNodeResponse>;
    killApp(action: KillAppAction): Promise<DeviceNodeResponse>;
    openDeepLink(action: DeeplinkAction): Promise<DeviceNodeResponse>;
    setLocation(action: SetLocationAction): Promise<DeviceNodeResponse>;
    switchToPrimaryApp(action: SwitchToPrimaryAppAction): Promise<DeviceNodeResponse>;
    checkAppInForeground(action: CheckAppInForegroundAction): Promise<DeviceNodeResponse>;
    captureState(traceStep?: number | null): Promise<DeviceNodeResponse>;
    getInstalledAppsResponse(): Promise<DeviceNodeResponse>;
    getInstalledApps(): Promise<DeviceAppInfo[]>;
    getScreenshot(action: GetScreenshotAction): Promise<DeviceNodeResponse>;
    getHierarchy(action: GetHierarchyAction): Promise<DeviceNodeResponse>;
    getScreenshotAndHierarchy(): Promise<DeviceScreenshotAndHierarchy>;
    refreshInstalledAppIds(options: {
        throwOnFailure: boolean;
    }): Promise<void>;
    close(): Promise<void>;
    resolveLogFilterIdentifier(appIdentifier: string): Promise<string | null>;
    killDriver(): void;
    private _getPhysicalButtonForKey;
    private _toResponse;
    private _isDriverAlive;
    private _withDriverRecovery;
    private _mergeLaunchResponse;
}
//# sourceMappingURL=IOSSimulator.d.ts.map