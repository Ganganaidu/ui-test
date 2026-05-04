import { AppUpload } from './AppUpload.js';
import { SingleArgument } from './SingleArgument.js';
/**
 * Dart equivalent: Point class in TestStep.dart (lines 146-174)
 */
export declare class Point {
    readonly x: number;
    readonly y: number;
    constructor(params: {
        x: number;
        y: number;
    });
    static fromJson(json: Record<string, unknown>): Point;
    toJson(): Record<string, unknown>;
}
/**
 * Percent-based point coordinates.
 * Dart: PointPercent class in TestStep.dart
 */
export declare class PointPercent {
    readonly xPercent: number;
    readonly yPercent: number;
    constructor(params: {
        xPercent: number;
        yPercent: number;
    });
    static fromJson(json: Record<string, unknown>): PointPercent;
    toJson(): Record<string, unknown>;
}
/**
 * Base class for all device actions. In Dart this is an abstract class.
 * We define action type constants as static members.
 */
export declare abstract class DeviceAction {
    static readonly TAP = "tap";
    static readonly TAP_PERCENT = "tapPercent";
    static readonly LONG_PRESS = "longPress";
    static readonly ENTER_TEXT = "enterText";
    static readonly ERASE_TEXT = "eraseText";
    static readonly COPY_TEXT = "copyText";
    static readonly PASTE_TEXT = "pasteText";
    static readonly BACK = "back";
    static readonly HOME = "home";
    static readonly ROTATE = "rotate";
    static readonly HIDE_KEYBOARD = "hideKeyboard";
    static readonly KILL_APP = "killApp";
    static readonly LAUNCH_APP = "launchApp";
    static readonly DEEPLINK = "deeplink";
    static readonly PRESS_KEY = "pressKey";
    static readonly SCROLL_ABS = "scrollAbs";
    static readonly WAIT = "wait";
    static readonly SET_LOCATION = "setLocation";
    static readonly SWITCH_TO_PRIMARY_APP = "switchToPrimaryApp";
    static readonly GET_HIERARCHY = "getHierarchy";
    static readonly GET_SCREENSHOT = "getScreenshot";
    static readonly GET_SCREENSHOT_AND_HIERARCHY = "getScreenshotAndHierarchy";
    static readonly GET_APP_LIST = "getAppList";
    static readonly CHECK_APP_IN_FOREGROUND = "checkAppInForeground";
    readonly type: string;
    constructor(type: string);
    toJson(): Record<string, unknown>;
}
/**
 * Tap at absolute pixel coordinates.
 * Dart: TapAction in TestStep.dart
 */
export declare class TapAction extends DeviceAction {
    readonly point: Point;
    readonly repeat: number;
    readonly delay: number;
    constructor(params: {
        point: Point;
        repeat?: number;
        delay?: number;
    });
    static fromJson(json: Record<string, unknown>): TapAction;
    toJson(): Record<string, unknown>;
}
/**
 * Tap at percentage coordinates.
 * Dart: TapPercentAction in TestStep.dart
 */
export declare class TapPercentAction extends DeviceAction {
    readonly point: PointPercent;
    constructor(params: {
        point: PointPercent;
    });
    static fromJson(json: Record<string, unknown>): TapPercentAction;
    toJson(): Record<string, unknown>;
}
/**
 * Long-press at absolute pixel coordinates.
 * Dart: LongPressAction in TestStep.dart
 */
export declare class LongPressAction extends DeviceAction {
    readonly point: Point;
    constructor(params: {
        point: Point;
    });
    static fromJson(json: Record<string, unknown>): LongPressAction;
    toJson(): Record<string, unknown>;
}
/**
 * Type text into a focused input field.
 * Dart: EnterTextAction in TestStep.dart
 */
export declare class EnterTextAction extends DeviceAction {
    readonly value: string;
    readonly shouldEraseText: boolean;
    readonly eraseCount: number | null;
    constructor(params: {
        value: string;
        shouldEraseText?: boolean;
        eraseCount?: number | null;
    });
    static fromJson(json: Record<string, unknown>): EnterTextAction;
    toJson(): Record<string, unknown>;
}
/**
 * Erase text from the focused input field.
 * Dart: EraseTextAction in TestStep.dart
 */
export declare class EraseTextAction extends DeviceAction {
    constructor();
}
/**
 * Absolute-coordinate scroll/swipe action.
 * Dart: ScrollAbsAction in TestStep.dart
 */
export declare class ScrollAbsAction extends DeviceAction {
    readonly startX: number;
    readonly startY: number;
    readonly endX: number;
    readonly endY: number;
    readonly durationMs: number;
    constructor(params: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        durationMs?: number;
    });
    static fromJson(json: Record<string, unknown>): ScrollAbsAction;
    toJson(): Record<string, unknown>;
}
/**
 * Press the system Back button (Android) / swipe-back (iOS).
 * Dart: BackAction in TestStep.dart
 */
export declare class BackAction extends DeviceAction {
    constructor();
}
/**
 * Press the system Home button.
 * Dart: HomeAction in TestStep.dart
 */
export declare class HomeAction extends DeviceAction {
    constructor();
}
/**
 * Rotate device orientation.
 * Dart: RotateAction in TestStep.dart
 */
export declare class RotateAction extends DeviceAction {
    constructor();
}
/**
 * Hide the software keyboard.
 * Dart: HideKeyboardAction in TestStep.dart
 */
export declare class HideKeyboardAction extends DeviceAction {
    constructor();
}
/**
 * Press a named key (e.g., 'enter', 'tab').
 * Dart: PressKeyAction in TestStep.dart
 */
export declare class PressKeyAction extends DeviceAction {
    readonly key: string;
    constructor(params: {
        key: string;
    });
    static fromJson(json: Record<string, unknown>): PressKeyAction;
    toJson(): Record<string, unknown>;
}
/**
 * Launch an app on the device.
 * Dart: LaunchAppAction in TestStep.dart
 */
export declare class LaunchAppAction extends DeviceAction {
    readonly appUpload: AppUpload;
    readonly allowAllPermissions: boolean;
    readonly shouldUninstallBeforeLaunch: boolean;
    readonly clearState: boolean;
    readonly stopAppBeforeLaunch: boolean;
    readonly arguments: Record<string, SingleArgument>;
    readonly permissions: Record<string, string>;
    constructor(params: {
        appUpload: AppUpload;
        allowAllPermissions?: boolean;
        shouldUninstallBeforeLaunch?: boolean;
        clearState?: boolean;
        stopAppBeforeLaunch?: boolean;
        arguments?: Record<string, SingleArgument>;
        permissions?: Record<string, string>;
    });
    toJson(): Record<string, unknown>;
}
/**
 * Open a deeplink URL on the device.
 * Dart: DeeplinkAction in TestStep.dart
 */
export declare class DeeplinkAction extends DeviceAction {
    readonly deeplink: string;
    constructor(params: {
        deeplink: string;
    });
    static fromJson(json: Record<string, unknown>): DeeplinkAction;
    toJson(): Record<string, unknown>;
}
/**
 * Set the device's GPS location.
 * Dart: SetLocationAction in TestStep.dart
 */
export declare class SetLocationAction extends DeviceAction {
    readonly lat: string;
    readonly long: string;
    constructor(params: {
        lat: string;
        long: string;
    });
    static fromJson(json: Record<string, unknown>): SetLocationAction;
    toJson(): Record<string, unknown>;
}
/**
 * Wait/pause for a duration.
 * Dart: WaitAction in TestStep.dart
 */
export declare class WaitAction extends DeviceAction {
    constructor();
}
/**
 * Request screenshot + hierarchy from the device.
 * Dart: GetScreenshotAndHierarchyAction in TestStep.dart
 */
export declare class GetScreenshotAndHierarchyAction extends DeviceAction {
    constructor();
}
/**
 * Request the current device screenshot.
 * Dart: GetScreenshotAction in TestStep.dart
 */
export declare class GetScreenshotAction extends DeviceAction {
    constructor();
}
/**
 * Request the current device hierarchy.
 * Dart: GetHierarchyAction in TestStep.dart
 */
export declare class GetHierarchyAction extends DeviceAction {
    constructor();
}
/**
 * Request the list of installed apps from the device.
 * Dart: GetAppListAction in TestStep.dart
 */
export declare class GetAppListAction extends DeviceAction {
    constructor();
}
/**
 * Kill a running app.
 * Dart: KillAppAction in TestStep.dart
 */
export declare class KillAppAction extends DeviceAction {
    readonly packageName: string;
    constructor(params: {
        packageName: string;
    });
    static fromJson(json: Record<string, unknown>): KillAppAction;
    toJson(): Record<string, unknown>;
}
/**
 * Switch to the primary app.
 * Dart: SwitchToPrimaryAppAction in TestStep.dart
 */
export declare class SwitchToPrimaryAppAction extends DeviceAction {
    readonly packageName: string;
    constructor(params: {
        packageName: string;
    });
    toJson(): Record<string, unknown>;
}
/**
 * Check if an app is in the foreground.
 * Dart: CheckAppInForegroundAction in TestStep.dart
 */
export declare class CheckAppInForegroundAction extends DeviceAction {
    readonly packageName: string;
    readonly timeoutSeconds: number;
    constructor(params: {
        packageName: string;
        timeoutSeconds?: number;
    });
    toJson(): Record<string, unknown>;
}
//# sourceMappingURL=DeviceAction.d.ts.map