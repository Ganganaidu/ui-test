import { EnterTextAction, LaunchAppAction, ScrollAbsAction, TapAction } from '@usb-ui-test/common';
import type { DeviceNodeResponse } from '@usb-ui-test/common';
import type { DeviceScreenshotAndHierarchy } from '@usb-ui-test/device-node';
import type { StepResult, StructuredStep } from './types.js';
/**
 * Minimal driver shape the executor needs. Both
 * @usb-ui-test/device-node's CommonDriverActions and the platform device
 * classes (AndroidDevice, IOSSimulator) satisfy this interface — we don't
 * type-narrow on which one we got, just on which methods we use.
 *
 * Note we use scrollAbs (not swipe) to match the Device class names; the
 * underlying gRPC action is still the same ScrollAbsAction.
 */
export interface DriverHandle {
    tap(action: TapAction): Promise<DeviceNodeResponse>;
    enterText(action: EnterTextAction): Promise<DeviceNodeResponse>;
    scrollAbs(action: ScrollAbsAction): Promise<DeviceNodeResponse>;
    launchApp(action: LaunchAppAction): Promise<DeviceNodeResponse>;
    getScreenshotAndHierarchy(): Promise<DeviceScreenshotAndHierarchy>;
}
export interface AppContext {
    /** Platform string from common/constants — 'android' | 'ios'. */
    readonly platform: string;
    /** Package name (Android) or bundle id (iOS). */
    readonly packageName: string;
    /** Optional opaque id used by AppUpload (the AI path threads this through). */
    readonly appUploadId?: string;
}
export interface DeterministicExecutorConfig {
    /** Driver actions handle bound to the active device session. */
    readonly driver: DriverHandle;
    /** Workspace-level app identity, used as the default for launchApp/clearAppData. */
    readonly appContext: AppContext;
    /** Steps to run, in order. */
    readonly steps: readonly StructuredStep[];
    /** Optional per-step timeout override (ms). Default 10_000. */
    readonly defaultStepTimeoutMs?: number;
    /** Optional progress callback fired before/after each step. */
    readonly onProgress?: (event: ExecutorProgressEvent) => void | Promise<void>;
}
export type ExecutorProgressEvent = {
    readonly type: 'step_start';
    readonly index: number;
    readonly step: StructuredStep;
} | {
    readonly type: 'step_complete';
    readonly index: number;
    readonly result: StepResult;
};
export interface DeterministicRunResult {
    readonly success: boolean;
    readonly steps: readonly StepResult[];
    /** Set when `success === false` — the index of the step that failed. */
    readonly failedAtIndex?: number;
}
export declare class DeterministicExecutor {
    private readonly _config;
    private readonly _defaultTimeoutMs;
    constructor(config: DeterministicExecutorConfig);
    run(): Promise<DeterministicRunResult>;
    private _runOne;
    /** Returns the resolved tap/swipe origin, when applicable, for the step trace. */
    private _dispatch;
    private _launchApp;
    private _clearAppData;
    private _tapOn;
    private _inputText;
    private _swipe;
    private _assertVisible;
    private _assertNotVisible;
    private _waitFor;
    /**
     * Resolve a selector to a tap point, retrying as the screen settles.
     * resolveSelector throws SelectorNotFoundError on miss; retryUntil swallows
     * the error and re-polls until the deadline.
     */
    private _resolvePointForSelector;
    private _resolveSwipeEndpoints;
    private _fetchHierarchy;
    private _waitStable;
    private _throwIfFailed;
}
//# sourceMappingURL=DeterministicExecutor.d.ts.map