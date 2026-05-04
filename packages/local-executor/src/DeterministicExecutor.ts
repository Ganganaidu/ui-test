// DeterministicExecutor.ts
//
// Runs a list of StructuredStep instances against a real device. No AI calls,
// no outbound network — every decision is made locally from the AX tree the
// existing on-device drivers already expose.
//
// The executor is built around the same CommonDriverActions handle the AI
// path uses, so we share the driver transport, the recording manager, and
// the gRPC plumbing. The only thing replaced is the brain that decides what
// to do next: the AI agent reads a screenshot and asks an LLM; we read the
// hierarchy and match a selector deterministically.
//
// Design notes:
//
// - Each step that needs a selector (tapOn, assertVisible, etc.) goes through
//   retryUntil() so we tolerate the inevitable "screen still settling" race
//   without forcing every test to sprinkle waitFor calls.
//
// - launchApp + clearAppData read from `appContext` when the step doesn't
//   carry its own appId — this matches how the workspace config configures
//   one app for the whole run.
//
// - We never throw out of `run()` — every error becomes a failed StepResult
//   and the loop stops. The caller decides how to surface it.

import {
  AppUpload,
  EnterTextAction,
  Hierarchy,
  LaunchAppAction,
  Logger,
  Point,
  ScrollAbsAction,
  TapAction,
} from '@usb-ui-test/common';
import type { DeviceNodeResponse } from '@usb-ui-test/common';
import type { DeviceScreenshotAndHierarchy } from '@usb-ui-test/device-node';
import type {
  AssertVisibleStep,
  AssertNotVisibleStep,
  ClearAppDataStep,
  Coordinate,
  InputTextStep,
  LaunchAppStep,
  StepResult,
  StructuredStep,
  SwipeStep,
  TapOnStep,
  WaitForStep,
} from './types.js';
import { findMatches, resolveSelector } from './selector.js';
import { retryUntil, waitUntilStable } from './waiter.js';

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

export type ExecutorProgressEvent =
  | { readonly type: 'step_start'; readonly index: number; readonly step: StructuredStep }
  | { readonly type: 'step_complete'; readonly index: number; readonly result: StepResult };

export interface DeterministicRunResult {
  readonly success: boolean;
  readonly steps: readonly StepResult[];
  /** Set when `success === false` — the index of the step that failed. */
  readonly failedAtIndex?: number;
}

export class DeterministicExecutor {
  private readonly _config: DeterministicExecutorConfig;
  private readonly _defaultTimeoutMs: number;

  constructor(config: DeterministicExecutorConfig) {
    this._config = config;
    this._defaultTimeoutMs = config.defaultStepTimeoutMs ?? 10_000;
  }

  async run(): Promise<DeterministicRunResult> {
    const results: StepResult[] = [];
    for (let i = 0; i < this._config.steps.length; i++) {
      const step = this._config.steps[i]!;
      await this._config.onProgress?.({ type: 'step_start', index: i, step });
      const result = await this._runOne(step);
      results.push(result);
      await this._config.onProgress?.({ type: 'step_complete', index: i, result });
      if (!result.success) {
        return {
          success: false,
          steps: results,
          failedAtIndex: i,
        };
      }
    }
    return { success: true, steps: results };
  }

  // -------------------------------------------------------------------------
  // step dispatch
  // -------------------------------------------------------------------------

  private async _runOne(step: StructuredStep): Promise<StepResult> {
    const startedAt = performance.now();
    try {
      const resolved = await this._dispatch(step);
      return {
        step,
        success: true,
        ...(resolved !== undefined ? { resolvedPoint: resolved } : {}),
        durationMs: Math.round(performance.now() - startedAt),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Logger.w(`[deterministic] ${step.kind} failed: ${msg}`);
      return {
        step,
        success: false,
        errorMessage: msg,
        durationMs: Math.round(performance.now() - startedAt),
      };
    }
  }

  /** Returns the resolved tap/swipe origin, when applicable, for the step trace. */
  private async _dispatch(
    step: StructuredStep,
  ): Promise<Coordinate | undefined> {
    switch (step.kind) {
      case 'launchApp':
        await this._launchApp(step);
        return undefined;
      case 'clearAppData':
        await this._clearAppData(step);
        return undefined;
      case 'tapOn':
        return this._tapOn(step);
      case 'inputText':
        return this._inputText(step);
      case 'swipe':
        return this._swipe(step);
      case 'assertVisible':
        return this._assertVisible(step);
      case 'assertNotVisible':
        return this._assertNotVisible(step);
      case 'waitFor':
        return this._waitFor(step);
    }
  }

  // -------------------------------------------------------------------------
  // command implementations
  // -------------------------------------------------------------------------

  private async _launchApp(step: LaunchAppStep): Promise<void> {
    const packageName = step.appId ?? this._config.appContext.packageName;
    const action = new LaunchAppAction({
      appUpload: new AppUpload({
        id: this._config.appContext.appUploadId ?? packageName,
        platform: this._config.appContext.platform,
        packageName,
      }),
      clearState: step.clearState ?? false,
    });
    const response = await this._config.driver.launchApp(action);
    this._throwIfFailed(response, `launchApp(${packageName})`);
    // Give the launch transition a moment to settle before the next step
    // tries to find an element on the home screen.
    await this._waitStable();
  }

  private async _clearAppData(step: ClearAppDataStep): Promise<void> {
    // The driver doesn't have a dedicated "clearAppData" — the AI path also
    // implements this via launchApp({clearState: true}). Mirror that.
    const packageName = step.appId ?? this._config.appContext.packageName;
    const action = new LaunchAppAction({
      appUpload: new AppUpload({
        id: this._config.appContext.appUploadId ?? packageName,
        platform: this._config.appContext.platform,
        packageName,
      }),
      clearState: true,
    });
    const response = await this._config.driver.launchApp(action);
    this._throwIfFailed(response, `clearAppData(${packageName})`);
    await this._waitStable();
  }

  private async _tapOn(step: TapOnStep): Promise<Coordinate> {
    const point = await this._resolvePointForSelector(
      step.selector,
      'tapOn',
    );
    const response = await this._config.driver.tap(
      new TapAction({ point: new Point(point) }),
    );
    this._throwIfFailed(response, 'tap');
    await this._waitStable();
    return point;
  }

  private async _inputText(step: InputTextStep): Promise<Coordinate | undefined> {
    let resolved: Coordinate | undefined;
    if (step.into) {
      resolved = await this._resolvePointForSelector(step.into, 'inputText.into');
      const tapResponse = await this._config.driver.tap(
        new TapAction({ point: new Point(resolved) }),
      );
      this._throwIfFailed(tapResponse, 'tap (focus before inputText)');
      await this._waitStable();
    }
    const response = await this._config.driver.enterText(
      new EnterTextAction({ value: step.value, shouldEraseText: step.clear ?? false }),
    );
    this._throwIfFailed(response, 'enterText');
    return resolved;
  }

  private async _swipe(step: SwipeStep): Promise<Coordinate | undefined> {
    const { from, to } = await this._resolveSwipeEndpoints(step);
    const response = await this._config.driver.scrollAbs(
      new ScrollAbsAction({
        startX: from.x,
        startY: from.y,
        endX: to.x,
        endY: to.y,
        durationMs: step.durationMs ?? 500,
      }),
    );
    this._throwIfFailed(response, 'swipe');
    await this._waitStable();
    return from;
  }

  private async _assertVisible(step: AssertVisibleStep): Promise<undefined> {
    await retryUntil(
      () => this._fetchHierarchy(),
      (h) => (findMatches(h, step.selector).length > 0 ? true : undefined),
      { timeoutMs: this._defaultTimeoutMs },
    );
    return undefined;
  }

  private async _assertNotVisible(step: AssertNotVisibleStep): Promise<undefined> {
    // Symmetric: poll until the selector is *gone*. Useful right after a
    // dismiss/close action where the disappearance may not be instant.
    await retryUntil(
      () => this._fetchHierarchy(),
      (h) => (findMatches(h, step.selector).length === 0 ? true : undefined),
      { timeoutMs: this._defaultTimeoutMs },
    );
    return undefined;
  }

  private async _waitFor(step: WaitForStep): Promise<undefined> {
    await retryUntil(
      () => this._fetchHierarchy(),
      (h) => (findMatches(h, step.selector).length > 0 ? true : undefined),
      { timeoutMs: step.timeoutMs ?? this._defaultTimeoutMs },
    );
    return undefined;
  }

  // -------------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------------

  /**
   * Resolve a selector to a tap point, retrying as the screen settles.
   * resolveSelector throws SelectorNotFoundError on miss; retryUntil swallows
   * the error and re-polls until the deadline.
   */
  private async _resolvePointForSelector(
    selector: TapOnStep['selector'],
    ctx: string,
  ): Promise<Coordinate> {
    return retryUntil(
      () => this._fetchHierarchy(),
      (h) => {
        const node = resolveSelector(h, selector);
        const center = node.getCenterPoint();
        if (!center) {
          throw new Error(
            `${ctx}: matched node has no bounds, cannot compute tap target`,
          );
        }
        return center;
      },
      { timeoutMs: this._defaultTimeoutMs },
    );
  }

  private async _resolveSwipeEndpoints(
    step: SwipeStep,
  ): Promise<{ from: Coordinate; to: Coordinate }> {
    if (step.from && step.to) {
      return { from: step.from, to: step.to };
    }
    if (!step.direction) {
      throw new Error('swipe requires either {from, to} or direction');
    }
    // Direction-based swipes need the screen size. Easiest source: the
    // bounds of the root-most node in the hierarchy span the screen.
    const hierarchy = await this._fetchHierarchy();
    const screen = inferScreenBounds(hierarchy);
    if (!screen) {
      throw new Error(
        'swipe direction needs screen size, but the hierarchy contains no bounded root node',
      );
    }
    const cx = Math.round((screen.left + screen.right) / 2);
    const cy = Math.round((screen.top + screen.bottom) / 2);
    const dx = Math.round((screen.right - screen.left) * 0.3);
    const dy = Math.round((screen.bottom - screen.top) * 0.3);

    switch (step.direction) {
      case 'up':
        return { from: { x: cx, y: cy + dy }, to: { x: cx, y: cy - dy } };
      case 'down':
        return { from: { x: cx, y: cy - dy }, to: { x: cx, y: cy + dy } };
      case 'left':
        return { from: { x: cx + dx, y: cy }, to: { x: cx - dx, y: cy } };
      case 'right':
        return { from: { x: cx - dx, y: cy }, to: { x: cx + dx, y: cy } };
    }
  }

  private async _fetchHierarchy(): Promise<Hierarchy> {
    // The driver returns hierarchy as a JSON string (the on-device drivers
    // serialize the AX tree before sending it over gRPC). Parse it once
    // here; an empty/missing payload yields an empty Hierarchy whose
    // selector lookups will simply not match.
    const result = await this._config.driver.getScreenshotAndHierarchy();
    if (!result.hierarchy) {
      return new Hierarchy(null);
    }
    return Hierarchy.fromJsonString(result.hierarchy);
  }

  private async _waitStable(): Promise<void> {
    await waitUntilStable(() => this._fetchHierarchy());
  }

  private _throwIfFailed(
    response: { isSuccess?: boolean; success?: boolean; error?: unknown },
    label: string,
  ): void {
    // DeviceNodeResponse uses `isSuccess`/`success` flags depending on call
    // site — accept either, matching how the AI executor checks responses.
    const ok = response.isSuccess ?? response.success;
    if (ok === false) {
      const errMsg =
        typeof response.error === 'string'
          ? response.error
          : response.error instanceof Error
          ? response.error.message
          : 'driver reported failure';
      throw new Error(`${label} failed: ${errMsg}`);
    }
  }
}

/** Find the largest bounded node — assume that's the window / root view. */
function inferScreenBounds(
  hierarchy: Hierarchy,
): { left: number; top: number; right: number; bottom: number } | null {
  let best: [number, number, number, number] | null = null;
  let bestArea = 0;
  for (const n of hierarchy.flattenedHierarchy) {
    if (!n.bounds) continue;
    const [l, t, r, b] = n.bounds;
    const area = Math.max(0, r - l) * Math.max(0, b - t);
    if (area > bestArea) {
      best = n.bounds;
      bestArea = area;
    }
  }
  if (!best) return null;
  const [left, top, right, bottom] = best;
  return { left, top, right, bottom };
}
