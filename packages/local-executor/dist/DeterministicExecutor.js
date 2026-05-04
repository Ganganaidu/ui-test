"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeterministicExecutor = void 0;
const common_1 = require("@usb-ui-test/common");
const selector_js_1 = require("./selector.js");
const waiter_js_1 = require("./waiter.js");
class DeterministicExecutor {
    _config;
    _defaultTimeoutMs;
    constructor(config) {
        this._config = config;
        this._defaultTimeoutMs = config.defaultStepTimeoutMs ?? 10_000;
    }
    async run() {
        const results = [];
        for (let i = 0; i < this._config.steps.length; i++) {
            const step = this._config.steps[i];
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
    async _runOne(step) {
        const startedAt = performance.now();
        try {
            const resolved = await this._dispatch(step);
            return {
                step,
                success: true,
                ...(resolved !== undefined ? { resolvedPoint: resolved } : {}),
                durationMs: Math.round(performance.now() - startedAt),
            };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            common_1.Logger.w(`[deterministic] ${step.kind} failed: ${msg}`);
            return {
                step,
                success: false,
                errorMessage: msg,
                durationMs: Math.round(performance.now() - startedAt),
            };
        }
    }
    /** Returns the resolved tap/swipe origin, when applicable, for the step trace. */
    async _dispatch(step) {
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
    async _launchApp(step) {
        const packageName = step.appId ?? this._config.appContext.packageName;
        const action = new common_1.LaunchAppAction({
            appUpload: new common_1.AppUpload({
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
    async _clearAppData(step) {
        // The driver doesn't have a dedicated "clearAppData" — the AI path also
        // implements this via launchApp({clearState: true}). Mirror that.
        const packageName = step.appId ?? this._config.appContext.packageName;
        const action = new common_1.LaunchAppAction({
            appUpload: new common_1.AppUpload({
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
    async _tapOn(step) {
        const point = await this._resolvePointForSelector(step.selector, 'tapOn');
        const response = await this._config.driver.tap(new common_1.TapAction({ point: new common_1.Point(point) }));
        this._throwIfFailed(response, 'tap');
        await this._waitStable();
        return point;
    }
    async _inputText(step) {
        let resolved;
        if (step.into) {
            resolved = await this._resolvePointForSelector(step.into, 'inputText.into');
            const tapResponse = await this._config.driver.tap(new common_1.TapAction({ point: new common_1.Point(resolved) }));
            this._throwIfFailed(tapResponse, 'tap (focus before inputText)');
            await this._waitStable();
        }
        const response = await this._config.driver.enterText(new common_1.EnterTextAction({ value: step.value, shouldEraseText: step.clear ?? false }));
        this._throwIfFailed(response, 'enterText');
        return resolved;
    }
    async _swipe(step) {
        const { from, to } = await this._resolveSwipeEndpoints(step);
        const response = await this._config.driver.scrollAbs(new common_1.ScrollAbsAction({
            startX: from.x,
            startY: from.y,
            endX: to.x,
            endY: to.y,
            durationMs: step.durationMs ?? 500,
        }));
        this._throwIfFailed(response, 'swipe');
        await this._waitStable();
        return from;
    }
    async _assertVisible(step) {
        await (0, waiter_js_1.retryUntil)(() => this._fetchHierarchy(), (h) => ((0, selector_js_1.findMatches)(h, step.selector).length > 0 ? true : undefined), { timeoutMs: this._defaultTimeoutMs });
        return undefined;
    }
    async _assertNotVisible(step) {
        // Symmetric: poll until the selector is *gone*. Useful right after a
        // dismiss/close action where the disappearance may not be instant.
        await (0, waiter_js_1.retryUntil)(() => this._fetchHierarchy(), (h) => ((0, selector_js_1.findMatches)(h, step.selector).length === 0 ? true : undefined), { timeoutMs: this._defaultTimeoutMs });
        return undefined;
    }
    async _waitFor(step) {
        await (0, waiter_js_1.retryUntil)(() => this._fetchHierarchy(), (h) => ((0, selector_js_1.findMatches)(h, step.selector).length > 0 ? true : undefined), { timeoutMs: step.timeoutMs ?? this._defaultTimeoutMs });
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
    async _resolvePointForSelector(selector, ctx) {
        return (0, waiter_js_1.retryUntil)(() => this._fetchHierarchy(), (h) => {
            const node = (0, selector_js_1.resolveSelector)(h, selector);
            const center = node.getCenterPoint();
            if (!center) {
                throw new Error(`${ctx}: matched node has no bounds, cannot compute tap target`);
            }
            return center;
        }, { timeoutMs: this._defaultTimeoutMs });
    }
    async _resolveSwipeEndpoints(step) {
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
            throw new Error('swipe direction needs screen size, but the hierarchy contains no bounded root node');
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
    async _fetchHierarchy() {
        // The driver returns hierarchy as a JSON string (the on-device drivers
        // serialize the AX tree before sending it over gRPC). Parse it once
        // here; an empty/missing payload yields an empty Hierarchy whose
        // selector lookups will simply not match.
        const result = await this._config.driver.getScreenshotAndHierarchy();
        if (!result.hierarchy) {
            return new common_1.Hierarchy(null);
        }
        return common_1.Hierarchy.fromJsonString(result.hierarchy);
    }
    async _waitStable() {
        await (0, waiter_js_1.waitUntilStable)(() => this._fetchHierarchy());
    }
    _throwIfFailed(response, label) {
        // DeviceNodeResponse uses `isSuccess`/`success` flags depending on call
        // site — accept either, matching how the AI executor checks responses.
        const ok = response.isSuccess ?? response.success;
        if (ok === false) {
            const errMsg = typeof response.error === 'string'
                ? response.error
                : response.error instanceof Error
                    ? response.error.message
                    : 'driver reported failure';
            throw new Error(`${label} failed: ${errMsg}`);
        }
    }
}
exports.DeterministicExecutor = DeterministicExecutor;
/** Find the largest bounded node — assume that's the window / root view. */
function inferScreenBounds(hierarchy) {
    let best = null;
    let bestArea = 0;
    for (const n of hierarchy.flattenedHierarchy) {
        if (!n.bounds)
            continue;
        const [l, t, r, b] = n.bounds;
        const area = Math.max(0, r - l) * Math.max(0, b - t);
        if (area > bestArea) {
            best = n.bounds;
            bestArea = area;
        }
    }
    if (!best)
        return null;
    const [left, top, right, bottom] = best;
    return { left, top, right, bottom };
}
//# sourceMappingURL=DeterministicExecutor.js.map