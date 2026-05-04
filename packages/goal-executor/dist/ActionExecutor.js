"use strict";
// Executes individual device actions: ground → coordinates → execute on device.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionExecutor = void 0;
const common_1 = require("@usb-ui-test/common");
const node_crypto_1 = require("node:crypto");
const VisualGrounder_js_1 = require("./ai/VisualGrounder.js");
const providerFailure_js_1 = require("./ai/providerFailure.js");
const GrounderResponseConverter_js_1 = require("./GrounderResponseConverter.js");
const trace_js_1 = require("./trace.js");
class TimedActionPhaseFailure extends Error {
    span;
    constructor(message, span, cause) {
        super(message);
        this.name = 'TimedActionPhaseFailure';
        this.span = span;
        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}
// ============================================================================
// ActionExecutor
// ============================================================================
/**
 * Executes individual actions: ground UI element → compute coordinates → device action.
 *
 */
class ActionExecutor {
    _agent;
    _aiAgent;
    _visualGrounder;
    _platform;
    _appIdentifier;
    _runtimeBindings;
    _logContext;
    constructor(params) {
        this._agent = params.agent;
        this._aiAgent = params.aiAgent;
        this._visualGrounder = new VisualGrounder_js_1.VisualGrounder(params.aiAgent);
        this._platform = params.platform;
        this._appIdentifier = params.appIdentifier;
        this._runtimeBindings = params.runtimeBindings;
        this._logContext = params.logContext;
    }
    /**
     * Execute an action based on the planner's output.
     * Routes to the correct handler based on action type.
     */
    async executeAction(input) {
        // Per-invocation accumulator — passed into helpers so concurrent
        // executeAction() calls on the same executor do not share state.
        const llmCalls = [];
        let output;
        try {
            switch (input.action) {
                case common_1.PLANNER_ACTION_TAP:
                    output = await this._executeTap(input, llmCalls);
                    break;
                case common_1.PLANNER_ACTION_LONG_PRESS:
                    output = await this._executeLongPress(input, llmCalls);
                    break;
                case common_1.PLANNER_ACTION_TYPE:
                    output = await this._executeType(input, llmCalls);
                    break;
                case common_1.PLANNER_ACTION_SCROLL:
                    output = await this._executeScroll(input, llmCalls);
                    break;
                case common_1.PLANNER_ACTION_BACK:
                    output = await this._executeSimpleAction(input, new common_1.BackAction());
                    break;
                case common_1.PLANNER_ACTION_HOME:
                    output = await this._executeSimpleAction(input, new common_1.HomeAction());
                    break;
                case common_1.PLANNER_ACTION_ROTATE:
                    output = await this._executeSingleDevicePhase(input, new common_1.RotateAction());
                    break;
                case common_1.PLANNER_ACTION_HIDE_KEYBOARD:
                    output = await this._executeSimpleAction(input, new common_1.HideKeyboardAction());
                    break;
                case common_1.PLANNER_ACTION_PRESS_ENTER:
                    output = await this._executePressEnter(input);
                    break;
                case common_1.PLANNER_ACTION_LAUNCH_APP:
                    output = await this._executeLaunchApp(input, llmCalls);
                    break;
                case common_1.PLANNER_ACTION_SET_LOCATION:
                    output = await this._executeSetLocation(input, llmCalls);
                    break;
                case common_1.PLANNER_ACTION_WAIT:
                    output = await this._executeWait(input);
                    break;
                case common_1.PLANNER_ACTION_DEEPLINK:
                    output = await this._executeDeeplink(input);
                    break;
                default:
                    output = { success: false, error: `Unknown action: ${input.action}` };
            }
        }
        catch (error) {
            const terminalFailure = (0, providerFailure_js_1.terminalFailureFromError)(error);
            if (terminalFailure) {
                common_1.Logger.e(terminalFailure.message);
            }
            else {
                common_1.Logger.e(`Action ${input.action} failed:`, error);
            }
            output = this._failure([], error);
        }
        if (llmCalls.length > 0) {
            output = { ...output, llmCalls };
        }
        return output;
    }
    async _executeTap(input, llmCalls) {
        const spans = [];
        let groundOutcome;
        try {
            groundOutcome = await this._groundToPoint(input, common_1.FEATURE_GROUNDER, 'action.ground', llmCalls);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        this._pushGroundSpan(spans, 'action.ground', groundOutcome);
        if (!groundOutcome.result.success || !groundOutcome.result.data) {
            if (groundOutcome.result.error === 'needsVisualGrounding') {
                const fallbackResult = await this._executeVisualGroundingFallback(input, 'tap', llmCalls);
                this._mergeTrace(spans, fallbackResult.trace);
                if (!fallbackResult.success) {
                    return {
                        success: false,
                        error: fallbackResult.error ?? 'Visual grounding failed',
                        trace: this._buildTrace(spans),
                        terminalFailure: fallbackResult.terminalFailure,
                    };
                }
                return this._success(spans);
            }
            return this._failure(spans, groundOutcome.result.error ?? 'Grounding failed');
        }
        const point = groundOutcome.result.data;
        const repeatCount = Math.max(1, input.repeat ?? 1);
        const delayBetweenTapMs = input.delayBetweenTapMs ?? 500;
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                for (let index = 0; index < repeatCount; index++) {
                    const action = new common_1.TapAction({
                        point: new common_1.Point({ x: point.x, y: point.y }),
                    });
                    const result = await this._executeDeviceAction(action, input.traceStep);
                    if (!result.success) {
                        throw new Error(result.error ?? 'Tap action failed');
                    }
                    if (index < repeatCount - 1) {
                        await this._delay(delayBetweenTapMs);
                    }
                }
            }, {
                successDetail: () => `repeats=${repeatCount} delayBetweenTapMs=${delayBetweenTapMs}`,
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeLongPress(input, llmCalls) {
        const spans = [];
        let groundOutcome;
        try {
            groundOutcome = await this._groundToPoint(input, common_1.FEATURE_GROUNDER, 'action.ground', llmCalls);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        this._pushGroundSpan(spans, 'action.ground', groundOutcome);
        if (!groundOutcome.result.success || !groundOutcome.result.data) {
            if (groundOutcome.result.error === 'needsVisualGrounding') {
                const fallbackResult = await this._executeVisualGroundingFallback(input, 'longPress', llmCalls);
                this._mergeTrace(spans, fallbackResult.trace);
                if (!fallbackResult.success) {
                    return {
                        success: false,
                        error: fallbackResult.error ?? 'Visual grounding failed',
                        trace: this._buildTrace(spans),
                        terminalFailure: fallbackResult.terminalFailure,
                    };
                }
                return this._success(spans);
            }
            return this._failure(spans, groundOutcome.result.error ?? 'Grounding failed');
        }
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const action = new common_1.LongPressAction({
                    point: new common_1.Point({
                        x: groundOutcome.result.data.x,
                        y: groundOutcome.result.data.y,
                    }),
                });
                const result = await this._executeDeviceAction(action, input.traceStep);
                if (!result.success) {
                    throw new Error(result.error ?? 'Long press action failed');
                }
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeType(input, llmCalls) {
        const spans = [];
        let textToType = '';
        let rawTextToType = '';
        try {
            const prepPhase = await this._runTimedPhase(input, 'action.prep', async () => {
                const textMatch = input.reason.match(/"([^"]*)"/) ??
                    input.reason.match(/'([^']*)'/);
                rawTextToType = input.text ?? (textMatch ? textMatch[1] : input.reason);
                textToType = this._runtimeBindings
                    ? (0, common_1.resolveRuntimePlaceholders)(rawTextToType, this._runtimeBindings)
                    : rawTextToType;
            }, {
                successDetail: () => `textLength=${rawTextToType.length} clearText=${input.clearText ?? true}`,
            });
            spans.push(prepPhase.span);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        let focusOutcome;
        try {
            focusOutcome = await this._groundToPoint(input, common_1.FEATURE_INPUT_FOCUS_GROUNDER, 'action.ground', llmCalls);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        this._pushGroundSpan(spans, 'action.ground', focusOutcome);
        if (!focusOutcome.result.success) {
            return this._failure(spans, focusOutcome.result.error ?? 'Input focus grounding failed');
        }
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                if (focusOutcome.result.data !== null && focusOutcome.result.data !== undefined) {
                    const tapAction = new common_1.TapAction({
                        point: new common_1.Point({
                            x: focusOutcome.result.data.x,
                            y: focusOutcome.result.data.y,
                        }),
                    });
                    const tapResult = await this._executeDeviceAction(tapAction, input.traceStep);
                    if (!tapResult.success) {
                        throw new Error(tapResult.error ?? 'Failed to focus input field');
                    }
                    await this._delay(300);
                }
                const action = new common_1.EnterTextAction({
                    value: textToType,
                    shouldEraseText: input.clearText ?? true,
                });
                const response = await this._executeDeviceAction(action, input.traceStep);
                if (!response.success) {
                    throw new Error(response.error ?? 'Failed to enter text');
                }
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeScroll(input, llmCalls) {
        const spans = [];
        const act = input.reason.trim() ||
            (input.direction ? `Swipe ${input.direction}` : 'Scroll the current view.');
        let grounderResponse;
        try {
            grounderResponse = await this._callGrounder(input, {
                feature: common_1.FEATURE_SCROLL_INDEX_GROUNDER,
                act,
                hierarchy: input.hierarchy,
                screenshot: input.screenshot,
                platform: this._platform,
            }, llmCalls);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        const scrollResult = GrounderResponseConverter_js_1.GrounderResponseConverter.extractScrollAction({
            output: grounderResponse.output,
            screenWidth: input.screenWidth,
            screenHeight: input.screenHeight,
        });
        spans.push(this._llmTraceToSpan('action.ground', grounderResponse.trace, scrollResult.success ? 'success' : 'failure', this._groundTraceDetail(grounderResponse.trace, common_1.FEATURE_SCROLL_INDEX_GROUNDER, scrollResult.success ? undefined : scrollResult.error ?? 'Scroll grounding failed')));
        if (!scrollResult.success || !scrollResult.data) {
            return this._failure(spans, scrollResult.error ?? 'Scroll grounding failed');
        }
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const result = await this._executeDeviceAction(scrollResult.data, input.traceStep);
                if (!result.success) {
                    throw new Error(result.error ?? 'Scroll action failed');
                }
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executePressEnter(input) {
        const action = new common_1.PressKeyAction({ key: 'enter' });
        return await this._executeSingleDevicePhase(input, action);
    }
    async _executeLaunchApp(input, llmCalls) {
        const spans = [];
        let apps = [];
        try {
            const prepPhase = await this._runTimedPhase(input, 'action.prep', async () => {
                const appListResponse = await this._agent.executeAction(new common_1.DeviceActionRequest({
                    requestId: (0, node_crypto_1.randomUUID)(),
                    action: new common_1.GetAppListAction(),
                    timeout: 10,
                    traceStep: input.traceStep,
                }));
                if (!appListResponse.success) {
                    throw new Error(appListResponse.message ?? 'Failed to load installed apps');
                }
                apps = appListResponse.data
                    ? (appListResponse.data['apps'] ?? [])
                    : [];
            }, {
                successDetail: () => `appCount=${apps.length}`,
            });
            spans.push(prepPhase.span);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        let grounderResponse;
        try {
            grounderResponse = await this._callGrounder(input, {
                feature: common_1.FEATURE_LAUNCH_APP_GROUNDER,
                act: input.reason,
                platform: this._platform,
                availableApps: apps,
            }, llmCalls);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        const output = grounderResponse.output;
        const packageName = output['packageName'];
        const grounderError = output['isError']
            ? output['reason'] ?? 'Launch app grounder failed'
            : !packageName
                ? 'Launch app grounder did not return packageName'
                : undefined;
        spans.push(this._llmTraceToSpan('action.ground', grounderResponse.trace, grounderError ? 'failure' : 'success', this._groundTraceDetail(grounderResponse.trace, common_1.FEATURE_LAUNCH_APP_GROUNDER, grounderError)));
        if (grounderError) {
            return this._failure(spans, grounderError);
        }
        const action = new common_1.LaunchAppAction({
            appUpload: new common_1.AppUpload({ id: '', platform: this._platform, packageName }),
            allowAllPermissions: readOptionalBoolean(output, 'allowAllPermissions') ?? true,
            shouldUninstallBeforeLaunch: readOptionalBoolean(output, 'shouldUninstallBeforeLaunch') ??
                (packageName === this._appIdentifier ? false : true),
            clearState: readOptionalBoolean(output, 'clearState') ?? false,
            stopAppBeforeLaunch: readOptionalBoolean(output, 'stopAppBeforeLaunch') ?? false,
            permissions: output['permissions'] ?? {},
        });
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const result = await this._executeDeviceAction(action, input.traceStep);
                if (!result.success) {
                    throw new Error(result.error ?? 'Launch app action failed');
                }
            }, {
                successDetail: () => `package=${packageName}`,
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeSetLocation(input, llmCalls) {
        const spans = [];
        let grounderResponse;
        try {
            grounderResponse = await this._callGrounder(input, {
                feature: common_1.FEATURE_SET_LOCATION_GROUNDER,
                act: input.reason,
            }, llmCalls);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        const output = grounderResponse.output;
        const lat = output['lat'];
        const long = output['long'];
        const grounderError = output['isError']
            ? output['reason'] ?? 'Set location grounder failed'
            : !lat || !long
                ? 'Set location grounder did not return coordinates'
                : undefined;
        spans.push(this._llmTraceToSpan('action.ground', grounderResponse.trace, grounderError ? 'failure' : 'success', this._groundTraceDetail(grounderResponse.trace, common_1.FEATURE_SET_LOCATION_GROUNDER, grounderError)));
        if (grounderError) {
            return this._failure(spans, grounderError);
        }
        const action = new common_1.SetLocationAction({ lat: lat.trim(), long: long.trim() });
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const result = await this._executeDeviceAction(action, input.traceStep);
                if (!result.success) {
                    throw new Error(result.error ?? 'Set location action failed');
                }
            }, {
                successDetail: () => `lat=${lat.trim()} long=${long.trim()}`,
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeWait(input) {
        const spans = [];
        const durationSeconds = input.durationSeconds ?? 3;
        try {
            const waitPhase = await this._runTimedPhase(input, 'action.wait', async () => {
                common_1.Logger.d(`Waiting ${durationSeconds} seconds...`);
                await this._delay(Math.max(0, Math.round(durationSeconds * 1000)));
            }, {
                successDetail: () => `duration=${durationSeconds}s`,
            });
            spans.push(waitPhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeDeeplink(input) {
        const spans = [];
        let deeplink = '';
        let rawDeeplink = '';
        try {
            const prepPhase = await this._runTimedPhase(input, 'action.prep', async () => {
                rawDeeplink =
                    input.url ??
                        input.reason.match(/(https?:\/\/\S+|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/\S+)/)?.[1] ??
                        '';
                if (!rawDeeplink) {
                    throw new Error('Could not extract deeplink URL from reason');
                }
                deeplink = this._runtimeBindings
                    ? (0, common_1.resolveRuntimePlaceholders)(rawDeeplink, this._runtimeBindings)
                    : rawDeeplink;
            }, {
                successDetail: () => `url=${rawDeeplink}`,
            });
            spans.push(prepPhase.span);
        }
        catch (error) {
            return this._failure(spans, error);
        }
        const action = new common_1.DeeplinkAction({ deeplink });
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const result = await this._executeDeviceAction(action, input.traceStep);
                if (!result.success) {
                    throw new Error(result.error ?? 'Deeplink action failed');
                }
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeSimpleAction(input, action) {
        return await this._executeSingleDevicePhase(input, action);
    }
    async _executeSingleDevicePhase(input, action) {
        const spans = [];
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const result = await this._executeDeviceAction(action, input.traceStep);
                if (!result.success) {
                    throw new Error(result.error ?? 'Device action failed');
                }
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _groundToPoint(input, feature, tracePhase, llmCalls) {
        const grounderResponse = await this._callGrounder(input, {
            feature,
            act: input.reason,
            hierarchy: input.hierarchy,
            screenshot: input.screenshot,
            platform: this._platform,
            tracePhase,
        }, llmCalls);
        return {
            result: GrounderResponseConverter_js_1.GrounderResponseConverter.extractPoint({
                output: grounderResponse.output,
                flattenedHierarchy: input.hierarchy?.flattenedHierarchy ?? [],
                screenWidth: input.screenWidth,
                screenHeight: input.screenHeight,
            }),
            trace: grounderResponse.trace,
            detail: this._groundTraceDetail(grounderResponse.trace, feature, typeof grounderResponse.output['reason'] === 'string'
                ? grounderResponse.output['reason']
                : undefined),
        };
    }
    async _executeVisualGroundingFallback(input, actionType, llmCalls) {
        const spans = [];
        if (!input.screenshot) {
            spans.push({
                name: 'action.visual_fallback',
                durationMs: 0,
                status: 'failure',
                detail: 'needsVisualGrounding but no screenshot available',
            });
            return {
                success: false,
                error: 'needsVisualGrounding but no screenshot available',
                trace: this._buildTrace(spans),
            };
        }
        const startedAt = (0, trace_js_1.nowMs)();
        let result;
        try {
            result = await this._visualGrounder.ground({
                act: input.reason,
                screenshot: input.screenshot,
                platform: this._platform,
                traceStep: input.traceStep,
                logContext: this._logContext,
            });
            if (result.llmCall) {
                llmCalls.push(result.llmCall);
            }
        }
        catch (error) {
            const message = this._redactRuntimeString(error instanceof Error ? error.message : String(error));
            return this._failure(spans, new TimedActionPhaseFailure(message ?? 'Visual grounding failed', {
                name: 'action.visual_fallback',
                durationMs: (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt),
                status: 'failure',
                detail: message,
            }, error));
        }
        spans.push(this._llmTraceToSpan('action.visual_fallback', result.trace ?? {
            totalMs: (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt),
            promptBuildMs: 0,
            llmMs: (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt),
            parseMs: 0,
        }, result.success && result.x !== undefined && result.y !== undefined
            ? 'success'
            : 'failure', result.reason));
        if (!result.success || result.x === undefined || result.y === undefined) {
            return {
                success: false,
                error: `Visual grounding failed: ${result.reason}`,
                trace: this._buildTrace(spans),
            };
        }
        const point = new common_1.Point({ x: result.x, y: result.y });
        const action = actionType === 'longPress'
            ? new common_1.LongPressAction({ point })
            : new common_1.TapAction({ point });
        try {
            const devicePhase = await this._runTimedPhase(input, 'action.device', async () => {
                const response = await this._executeDeviceAction(action, input.traceStep);
                if (!response.success) {
                    throw new Error(response.error ?? `${actionType} action failed`);
                }
            });
            spans.push(devicePhase.span);
            return this._success(spans);
        }
        catch (error) {
            return this._failure(spans, error);
        }
    }
    async _executeDeviceAction(action, traceStep) {
        const response = await this._agent.executeAction(new common_1.DeviceActionRequest({
            requestId: (0, node_crypto_1.randomUUID)(),
            action,
            timeout: 30,
            traceStep,
        }));
        if (response.success) {
            return { success: true };
        }
        return {
            success: false,
            error: response.message ?? 'Action failed',
        };
    }
    async _callGrounder(input, request, llmCalls) {
        const startedAt = (0, trace_js_1.nowMs)();
        try {
            const response = await this._aiAgent.ground({
                ...request,
                traceStep: input.traceStep,
                tracePhase: request.tracePhase ?? 'action.ground',
                logContext: this._logContext,
            });
            if (response.llmCall) {
                llmCalls.push(response.llmCall);
            }
            return {
                ...response,
                trace: response.trace ??
                    {
                        totalMs: (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt),
                        promptBuildMs: 0,
                        llmMs: (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt),
                        parseMs: 0,
                    },
            };
        }
        catch (error) {
            const message = this._redactRuntimeString(error instanceof Error ? error.message : String(error));
            throw new TimedActionPhaseFailure(message ?? 'Grounder call failed', {
                name: request.tracePhase ?? 'action.ground',
                durationMs: (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt),
                status: 'failure',
                detail: message,
            }, error);
        }
    }
    async _runTimedPhase(input, name, fn, options) {
        const activePhase = (0, trace_js_1.startTracePhase)(input.traceStep, name, options?.startDetail);
        const startedAt = (0, trace_js_1.nowMs)();
        try {
            const result = await fn();
            const detail = options?.successDetail?.(result);
            const durationMs = (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt);
            (0, trace_js_1.finishTracePhase)(activePhase, 'success', detail);
            return {
                result,
                span: {
                    name,
                    durationMs,
                    status: 'success',
                    detail,
                },
            };
        }
        catch (error) {
            const detail = this._redactRuntimeString(options?.failureDetail?.(error) ??
                (error instanceof Error ? error.message : String(error)));
            const durationMs = (0, trace_js_1.roundDuration)((0, trace_js_1.nowMs)() - startedAt);
            (0, trace_js_1.finishTracePhase)(activePhase, 'failure', detail);
            throw new TimedActionPhaseFailure(detail ?? 'Action phase failed', {
                name,
                durationMs,
                status: 'failure',
                detail,
            }, error);
        }
    }
    _pushGroundSpan(spans, name, groundOutcome) {
        spans.push(this._llmTraceToSpan(name, groundOutcome.trace, this._groundStatus(groundOutcome.result), groundOutcome.detail ??
            (groundOutcome.result.success ? undefined : groundOutcome.result.error ?? undefined)));
    }
    _groundStatus(result) {
        if (result.success || result.error === 'needsVisualGrounding') {
            return 'success';
        }
        return 'failure';
    }
    _llmTraceToSpan(name, trace, status, detail) {
        return {
            name,
            durationMs: trace?.totalMs ?? 0,
            status,
            detail: this._composeDetail(trace, detail),
        };
    }
    _composeDetail(trace, detail) {
        const safeDetail = this._redactRuntimeString(detail);
        if (!trace && !detail) {
            return undefined;
        }
        if (!trace) {
            return safeDetail;
        }
        return (0, trace_js_1.describeLLMTrace)({
            promptBuildMs: trace.promptBuildMs,
            llmMs: trace.llmMs,
            parseMs: trace.parseMs,
            extraDetail: safeDetail,
        });
    }
    _groundTraceDetail(trace, feature, reason) {
        const detail = `feature=${feature}${reason ? ` reason=${reason}` : ''}`;
        return this._composeDetail(trace, detail) ??
            this._redactRuntimeString(detail) ??
            detail;
    }
    _success(spans) {
        return {
            success: true,
            trace: this._buildTrace(spans),
        };
    }
    _failure(spans, error) {
        const terminalFailure = (0, providerFailure_js_1.terminalFailureFromError)(error);
        if (error instanceof TimedActionPhaseFailure) {
            spans.push(error.span);
            return {
                success: false,
                error: this._redactRuntimeString(error.message) ?? error.message,
                trace: this._buildTrace(spans),
                terminalFailure,
            };
        }
        return {
            success: false,
            error: this._redactRuntimeString(error instanceof Error ? error.message : String(error)) ?? (error instanceof Error ? error.message : String(error)),
            trace: this._buildTrace(spans),
            terminalFailure,
        };
    }
    _buildTrace(spans) {
        return {
            totalMs: spans.reduce((sum, span) => sum + span.durationMs, 0),
            spans: spans.map((span) => ({
                ...span,
                detail: this._redactRuntimeString(span.detail),
            })),
        };
    }
    _mergeTrace(spans, trace) {
        if (!trace) {
            return;
        }
        spans.push(...trace.spans);
    }
    _redactRuntimeString(value) {
        if (!value || !this._runtimeBindings) {
            return value;
        }
        return (0, common_1.redactResolvedValue)(value, this._runtimeBindings);
    }
    _delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.ActionExecutor = ActionExecutor;
function readOptionalBoolean(record, key) {
    const value = record[key];
    return typeof value === 'boolean' ? value : undefined;
}
//# sourceMappingURL=ActionExecutor.js.map