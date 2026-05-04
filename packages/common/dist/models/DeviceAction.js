"use strict";
// Port of common/model/TestStep.dart -- a focused subset used by the CLI,
// device-node runtime, and transport parity layers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckAppInForegroundAction = exports.SwitchToPrimaryAppAction = exports.KillAppAction = exports.GetAppListAction = exports.GetHierarchyAction = exports.GetScreenshotAction = exports.GetScreenshotAndHierarchyAction = exports.WaitAction = exports.SetLocationAction = exports.DeeplinkAction = exports.LaunchAppAction = exports.PressKeyAction = exports.HideKeyboardAction = exports.RotateAction = exports.HomeAction = exports.BackAction = exports.ScrollAbsAction = exports.EraseTextAction = exports.EnterTextAction = exports.LongPressAction = exports.TapPercentAction = exports.TapAction = exports.DeviceAction = exports.PointPercent = exports.Point = void 0;
// ============================================================================
// Point & PointPercent -- used by GrounderResponseConverter and actions
// ============================================================================
/**
 * Dart equivalent: Point class in TestStep.dart (lines 146-174)
 */
class Point {
    x;
    y;
    constructor(params) {
        this.x = params.x;
        this.y = params.y;
    }
    static fromJson(json) {
        return new Point({
            x: json['x'],
            y: json['y'],
        });
    }
    toJson() {
        return { x: this.x, y: this.y };
    }
}
exports.Point = Point;
/**
 * Percent-based point coordinates.
 * Dart: PointPercent class in TestStep.dart
 */
class PointPercent {
    xPercent;
    yPercent;
    constructor(params) {
        this.xPercent = params.xPercent;
        this.yPercent = params.yPercent;
    }
    static fromJson(json) {
        return new PointPercent({
            xPercent: json['xPercent'],
            yPercent: json['yPercent'],
        });
    }
    toJson() {
        return {
            xPercent: this.xPercent,
            yPercent: this.yPercent,
        };
    }
}
exports.PointPercent = PointPercent;
// ============================================================================
// DeviceAction -- base class for all device actions
// Dart equivalent: abstract class StepAction in TestStep.dart
// ============================================================================
/**
 * Base class for all device actions. In Dart this is an abstract class.
 * We define action type constants as static members.
 */
class DeviceAction {
    // Dart: static const String tap = 'tap'; etc.
    static TAP = 'tap';
    static TAP_PERCENT = 'tapPercent';
    static LONG_PRESS = 'longPress';
    static ENTER_TEXT = 'enterText';
    static ERASE_TEXT = 'eraseText';
    static COPY_TEXT = 'copyText';
    static PASTE_TEXT = 'pasteText';
    static BACK = 'back';
    static HOME = 'home';
    static ROTATE = 'rotate';
    static HIDE_KEYBOARD = 'hideKeyboard';
    static KILL_APP = 'killApp';
    static LAUNCH_APP = 'launchApp';
    static DEEPLINK = 'deeplink';
    static PRESS_KEY = 'pressKey';
    static SCROLL_ABS = 'scrollAbs';
    static WAIT = 'wait';
    static SET_LOCATION = 'setLocation';
    static SWITCH_TO_PRIMARY_APP = 'switchToPrimaryApp';
    static GET_HIERARCHY = 'getHierarchy';
    static GET_SCREENSHOT = 'getScreenshot';
    static GET_SCREENSHOT_AND_HIERARCHY = 'getScreenshotAndHierarchy';
    static GET_APP_LIST = 'getAppList';
    static CHECK_APP_IN_FOREGROUND = 'checkAppInForeground';
    type;
    constructor(type) {
        this.type = type;
    }
    toJson() {
        return { type: this.type };
    }
}
exports.DeviceAction = DeviceAction;
// ============================================================================
// Concrete action classes -- focused subset used by the CLI + runtime parity
// ============================================================================
/**
 * Tap at absolute pixel coordinates.
 * Dart: TapAction in TestStep.dart
 */
class TapAction extends DeviceAction {
    point;
    repeat;
    delay;
    constructor(params) {
        super(DeviceAction.TAP);
        this.point = params.point;
        this.repeat = params.repeat ?? 1;
        this.delay = params.delay ?? 0;
    }
    static fromJson(json) {
        return new TapAction({
            point: Point.fromJson(json['point']),
            repeat: json['repeat'] ?? 1,
            delay: json['delay'] ?? 0,
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            point: this.point.toJson(),
            repeat: this.repeat,
            delay: this.delay,
        };
    }
}
exports.TapAction = TapAction;
/**
 * Tap at percentage coordinates.
 * Dart: TapPercentAction in TestStep.dart
 */
class TapPercentAction extends DeviceAction {
    point;
    constructor(params) {
        super(DeviceAction.TAP_PERCENT);
        this.point = params.point;
    }
    static fromJson(json) {
        return new TapPercentAction({
            point: PointPercent.fromJson(json['point']),
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            point: this.point.toJson(),
        };
    }
}
exports.TapPercentAction = TapPercentAction;
/**
 * Long-press at absolute pixel coordinates.
 * Dart: LongPressAction in TestStep.dart
 */
class LongPressAction extends DeviceAction {
    point;
    constructor(params) {
        super(DeviceAction.LONG_PRESS);
        this.point = params.point;
    }
    static fromJson(json) {
        return new LongPressAction({
            point: Point.fromJson(json['point']),
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            point: this.point.toJson(),
        };
    }
}
exports.LongPressAction = LongPressAction;
/**
 * Type text into a focused input field.
 * Dart: EnterTextAction in TestStep.dart
 */
class EnterTextAction extends DeviceAction {
    value;
    shouldEraseText;
    eraseCount;
    constructor(params) {
        super(DeviceAction.ENTER_TEXT);
        this.value = params.value;
        this.shouldEraseText = params.shouldEraseText ?? false;
        this.eraseCount = params.eraseCount ?? null;
    }
    static fromJson(json) {
        return new EnterTextAction({
            value: json['value'],
            shouldEraseText: json['shouldEraseText'] ?? false,
            eraseCount: json['eraseCount'] ?? null,
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            value: this.value,
            shouldEraseText: this.shouldEraseText,
            eraseCount: this.eraseCount,
        };
    }
}
exports.EnterTextAction = EnterTextAction;
/**
 * Erase text from the focused input field.
 * Dart: EraseTextAction in TestStep.dart
 */
class EraseTextAction extends DeviceAction {
    constructor() {
        super(DeviceAction.ERASE_TEXT);
    }
}
exports.EraseTextAction = EraseTextAction;
/**
 * Absolute-coordinate scroll/swipe action.
 * Dart: ScrollAbsAction in TestStep.dart
 */
class ScrollAbsAction extends DeviceAction {
    startX;
    startY;
    endX;
    endY;
    durationMs;
    constructor(params) {
        super(DeviceAction.SCROLL_ABS);
        this.startX = params.startX;
        this.startY = params.startY;
        this.endX = params.endX;
        this.endY = params.endY;
        this.durationMs = params.durationMs ?? 500;
    }
    static fromJson(json) {
        return new ScrollAbsAction({
            startX: json['startX'],
            startY: json['startY'],
            endX: json['endX'],
            endY: json['endY'],
            durationMs: json['durationMs'] ?? 500,
        });
    }
    toJson() {
        return {
            ...super.toJson(),
            startX: this.startX,
            startY: this.startY,
            endX: this.endX,
            endY: this.endY,
            durationMs: this.durationMs,
        };
    }
}
exports.ScrollAbsAction = ScrollAbsAction;
/**
 * Press the system Back button (Android) / swipe-back (iOS).
 * Dart: BackAction in TestStep.dart
 */
class BackAction extends DeviceAction {
    constructor() {
        super(DeviceAction.BACK);
    }
}
exports.BackAction = BackAction;
/**
 * Press the system Home button.
 * Dart: HomeAction in TestStep.dart
 */
class HomeAction extends DeviceAction {
    constructor() {
        super(DeviceAction.HOME);
    }
}
exports.HomeAction = HomeAction;
/**
 * Rotate device orientation.
 * Dart: RotateAction in TestStep.dart
 */
class RotateAction extends DeviceAction {
    constructor() {
        super(DeviceAction.ROTATE);
    }
}
exports.RotateAction = RotateAction;
/**
 * Hide the software keyboard.
 * Dart: HideKeyboardAction in TestStep.dart
 */
class HideKeyboardAction extends DeviceAction {
    constructor() {
        super(DeviceAction.HIDE_KEYBOARD);
    }
}
exports.HideKeyboardAction = HideKeyboardAction;
/**
 * Press a named key (e.g., 'enter', 'tab').
 * Dart: PressKeyAction in TestStep.dart
 */
class PressKeyAction extends DeviceAction {
    key;
    constructor(params) {
        super(DeviceAction.PRESS_KEY);
        this.key = params.key;
    }
    static fromJson(json) {
        return new PressKeyAction({ key: json['key'] });
    }
    toJson() {
        return { ...super.toJson(), key: this.key };
    }
}
exports.PressKeyAction = PressKeyAction;
/**
 * Launch an app on the device.
 * Dart: LaunchAppAction in TestStep.dart
 */
class LaunchAppAction extends DeviceAction {
    appUpload;
    allowAllPermissions;
    shouldUninstallBeforeLaunch;
    clearState;
    stopAppBeforeLaunch;
    arguments;
    permissions;
    constructor(params) {
        super(DeviceAction.LAUNCH_APP);
        this.appUpload = params.appUpload;
        this.allowAllPermissions = params.allowAllPermissions ?? true;
        this.shouldUninstallBeforeLaunch = params.shouldUninstallBeforeLaunch ?? true;
        this.clearState = params.clearState ?? false;
        this.stopAppBeforeLaunch = params.stopAppBeforeLaunch ?? false;
        this.arguments = params.arguments ?? {};
        this.permissions = params.permissions ?? {};
    }
    toJson() {
        return {
            ...super.toJson(),
            appUpload: {
                id: this.appUpload.id,
                platform: this.appUpload.platform,
                packageName: this.appUpload.packageName,
            },
            allowAllPermissions: this.allowAllPermissions,
            shouldUninstallBeforeLaunch: this.shouldUninstallBeforeLaunch,
            clearState: this.clearState,
            stopAppBeforeLaunch: this.stopAppBeforeLaunch,
            arguments: this.arguments,
            permissions: this.permissions,
        };
    }
}
exports.LaunchAppAction = LaunchAppAction;
/**
 * Open a deeplink URL on the device.
 * Dart: DeeplinkAction in TestStep.dart
 */
class DeeplinkAction extends DeviceAction {
    deeplink;
    constructor(params) {
        super(DeviceAction.DEEPLINK);
        this.deeplink = params.deeplink;
    }
    static fromJson(json) {
        return new DeeplinkAction({ deeplink: json['deeplink'] });
    }
    toJson() {
        return { ...super.toJson(), deeplink: this.deeplink };
    }
}
exports.DeeplinkAction = DeeplinkAction;
/**
 * Set the device's GPS location.
 * Dart: SetLocationAction in TestStep.dart
 */
class SetLocationAction extends DeviceAction {
    lat;
    long;
    constructor(params) {
        super(DeviceAction.SET_LOCATION);
        this.lat = params.lat;
        this.long = params.long;
    }
    static fromJson(json) {
        return new SetLocationAction({
            lat: json['lat'],
            long: json['long'],
        });
    }
    toJson() {
        return { ...super.toJson(), lat: this.lat, long: this.long };
    }
}
exports.SetLocationAction = SetLocationAction;
/**
 * Wait/pause for a duration.
 * Dart: WaitAction in TestStep.dart
 */
class WaitAction extends DeviceAction {
    constructor() {
        super(DeviceAction.WAIT);
    }
}
exports.WaitAction = WaitAction;
/**
 * Request screenshot + hierarchy from the device.
 * Dart: GetScreenshotAndHierarchyAction in TestStep.dart
 */
class GetScreenshotAndHierarchyAction extends DeviceAction {
    constructor() {
        super(DeviceAction.GET_SCREENSHOT_AND_HIERARCHY);
    }
}
exports.GetScreenshotAndHierarchyAction = GetScreenshotAndHierarchyAction;
/**
 * Request the current device screenshot.
 * Dart: GetScreenshotAction in TestStep.dart
 */
class GetScreenshotAction extends DeviceAction {
    constructor() {
        super(DeviceAction.GET_SCREENSHOT);
    }
}
exports.GetScreenshotAction = GetScreenshotAction;
/**
 * Request the current device hierarchy.
 * Dart: GetHierarchyAction in TestStep.dart
 */
class GetHierarchyAction extends DeviceAction {
    constructor() {
        super(DeviceAction.GET_HIERARCHY);
    }
}
exports.GetHierarchyAction = GetHierarchyAction;
/**
 * Request the list of installed apps from the device.
 * Dart: GetAppListAction in TestStep.dart
 */
class GetAppListAction extends DeviceAction {
    constructor() {
        super(DeviceAction.GET_APP_LIST);
    }
}
exports.GetAppListAction = GetAppListAction;
/**
 * Kill a running app.
 * Dart: KillAppAction in TestStep.dart
 */
class KillAppAction extends DeviceAction {
    packageName;
    constructor(params) {
        super(DeviceAction.KILL_APP);
        this.packageName = params.packageName;
    }
    static fromJson(json) {
        return new KillAppAction({
            packageName: json['packageName'],
        });
    }
    toJson() {
        return { ...super.toJson(), packageName: this.packageName };
    }
}
exports.KillAppAction = KillAppAction;
/**
 * Switch to the primary app.
 * Dart: SwitchToPrimaryAppAction in TestStep.dart
 */
class SwitchToPrimaryAppAction extends DeviceAction {
    packageName;
    constructor(params) {
        super(DeviceAction.SWITCH_TO_PRIMARY_APP);
        this.packageName = params.packageName;
    }
    toJson() {
        return { ...super.toJson(), packageName: this.packageName };
    }
}
exports.SwitchToPrimaryAppAction = SwitchToPrimaryAppAction;
/**
 * Check if an app is in the foreground.
 * Dart: CheckAppInForegroundAction in TestStep.dart
 */
class CheckAppInForegroundAction extends DeviceAction {
    packageName;
    timeoutSeconds;
    constructor(params) {
        super(DeviceAction.CHECK_APP_IN_FOREGROUND);
        this.packageName = params.packageName;
        this.timeoutSeconds = params.timeoutSeconds ?? 10;
    }
    toJson() {
        return {
            ...super.toJson(),
            packageName: this.packageName,
            timeoutSeconds: this.timeoutSeconds,
        };
    }
}
exports.CheckAppInForegroundAction = CheckAppInForegroundAction;
//# sourceMappingURL=DeviceAction.js.map