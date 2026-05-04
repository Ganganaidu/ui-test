"use strict";
// The main loop: screenshot → plan → act → repeat.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestExecutor = void 0;
const common_1 = require("@usb-ui-test/common");
const node_crypto_1 = require("node:crypto");
const providerFailure_js_1 = require("./ai/providerFailure.js");
const ActionExecutor_js_1 = require("./ActionExecutor.js");
const trace_js_1 = require("./trace.js");
// ============================================================================
// Helpers
// ============================================================================
const MAX_LOG_FIELD_LENGTH = 300;
/** Strip ANSI escapes and ASCII control chars from model-generated strings before logging. */
function sanitizeLogField(value) {
    // eslint-disable-next-line no-control-regex
    const cleaned = value.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
    return cleaned.length > MAX_LOG_FIELD_LENGTH
        ? cleaned.slice(0, MAX_LOG_FIELD_LENGTH) + '…'
        : cleaned;
}
const MAX_CONSECUTIVE_TRANSIENT_CAPTURE_FAILURES = 2;
// ============================================================================
// TestExecutor
// ============================================================================
/**
 * Orchestrates the full goal execution loop:
 *   1. Capture device state (screenshot + hierarchy)
 *   2. Call AI planner → get next action
 *   3. Execute action via ActionExecutor
 *   4. Record result, check for done/failure
 *   5. Repeat
 *
 */
class TestExecutor {
    _config;
    _actionExecutor;
    _aborted = false;
    _steps = [];
    constructor(config) {
        this._config = config;
        this._actionExecutor = new ActionExecutor_js_1.ActionExecutor({
            agent: config.agent,
            aiAgent: config.aiAgent,
            platform: config.platform,
            appIdentifier: config.appIdentifier,
            runtimeBindings: config.runtimeBindings,
            logContext: config.logContext,
        });
    }
    /**
     * Abort the goal execution.
     * The loop will stop after the current iteration completes.
     */
    abort() {
        this._aborted = true;
        common_1.Logger.i('Goal execution aborted');
    }
    /**
     * Backward-compatible alias for abort().
     */
    cancel() {
        this.abort();
    }
    /**
     * Execute the goal. Main entry point.
     */
    async executeGoal(onProgress) {
        const maxIterations = this._config.maxIterations ?? common_1.DEFAULT_MAX_ITERATIONS;
        const startedAt = new Date().toISOString();
        let history = '';
        let remember = [];
        let consecutiveTransientCaptureFailures = 0;
        common_1.Logger.i(`Starting goal execution: "${this._config.goal}"`);
        common_1.Logger.i(`Max iterations: ${maxIterations}`);
        for (let iteration = 1; iteration <= maxIterations; iteration++) {
            const stepTrace = new trace_js_1.StepTraceBuilder(iteration);
            if (this._aborted) {
                return {
                    success: false,
                    status: 'aborted',
                    message: 'Goal execution was aborted',
                    platform: this._config.platform,
                    startedAt,
                    completedAt: new Date().toISOString(),
                    steps: this._steps,
                    totalIterations: iteration - 1,
                };
            }
            await onProgress?.({
                type: 'planning',
                iteration,
                totalIterations: maxIterations,
                message: 'Capturing device state...',
            });
            const capturePhase = (0, trace_js_1.startTracePhase)(iteration, 'capture.total');
            const captureResult = await this._captureDeviceState(iteration);
            const captureSpan = stepTrace.addSpanFromActivePhase(capturePhase, captureResult.status === 'success' ? 'success' : 'failure', captureResult.status === 'success' ? undefined : captureResult.message);
            stepTrace.setAction('captureDeviceState');
            stepTrace.addSequentialTimings(this._captureTraceToTimings(captureResult.captureTrace), {
                startMs: captureSpan.startMs,
            });
            if (captureResult.status !== 'success') {
                consecutiveTransientCaptureFailures += 1;
                stepTrace.markFailure(captureResult.message);
                const trace = this._emitTraceSummary(stepTrace);
                const captureStep = {
                    iteration,
                    action: 'captureDeviceState',
                    reason: captureResult.message,
                    naturalLanguageAction: 'Capture device state',
                    success: false,
                    errorMessage: captureResult.message,
                    timestamp: new Date().toISOString(),
                    durationMs: trace.totalMs,
                    trace,
                };
                this._steps.push(captureStep);
                await onProgress?.({
                    type: 'error',
                    iteration,
                    totalIterations: maxIterations,
                    message: captureResult.message,
                });
                if (captureResult.status === 'fatal') {
                    return {
                        success: false,
                        status: 'failure',
                        message: captureResult.message,
                        platform: this._config.platform,
                        startedAt,
                        completedAt: new Date().toISOString(),
                        steps: this._steps,
                        totalIterations: iteration,
                    };
                }
                common_1.Logger.w(`Transient device state capture failure (${consecutiveTransientCaptureFailures}/${MAX_CONSECUTIVE_TRANSIENT_CAPTURE_FAILURES}): ${captureResult.message}`);
                if (consecutiveTransientCaptureFailures >=
                    MAX_CONSECUTIVE_TRANSIENT_CAPTURE_FAILURES) {
                    return {
                        success: false,
                        status: 'failure',
                        message: `Repeated transient device state capture failures: ${captureResult.message}`,
                        platform: this._config.platform,
                        startedAt,
                        completedAt: new Date().toISOString(),
                        steps: this._steps,
                        totalIterations: iteration,
                    };
                }
                continue;
            }
            consecutiveTransientCaptureFailures = 0;
            const deviceState = captureResult.deviceState;
            await onProgress?.({
                type: 'planning',
                iteration,
                totalIterations: maxIterations,
                message: 'Thinking...',
            });
            const planningPhase = (0, trace_js_1.startTracePhase)(iteration, 'planning.total');
            let plannerResponse;
            try {
                plannerResponse = await this._config.aiAgent.plan({
                    testObjective: this._config.goal,
                    platform: this._config.platform,
                    preActionScreenshot: deviceState.screenshot,
                    hierarchy: deviceState.hierarchy,
                    history: history || undefined,
                    remember: remember.length > 0 ? remember : undefined,
                    preContext: this._config.preContext,
                    appKnowledge: this._config.appKnowledge,
                    traceStep: iteration,
                    logContext: this._config.logContext,
                });
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                const terminalFailure = (0, providerFailure_js_1.terminalFailureFromError)(error);
                common_1.Logger.e('Planner call failed:', error);
                const planningSpan = stepTrace.addSpanFromActivePhase(planningPhase, 'failure', errorMsg);
                stepTrace.setAction('plannerError');
                stepTrace.markFailure(errorMsg);
                stepTrace.addSequentialTimings(undefined, { startMs: planningSpan.startMs });
                const trace = this._emitTraceSummary(stepTrace);
                this._steps.push({
                    iteration,
                    action: 'plannerError',
                    reason: errorMsg,
                    naturalLanguageAction: 'Planner error',
                    success: false,
                    errorMessage: errorMsg,
                    timestamp: new Date().toISOString(),
                    durationMs: trace.totalMs,
                    trace,
                });
                await onProgress?.({
                    type: 'error',
                    iteration,
                    totalIterations: maxIterations,
                    message: `Planner error: ${errorMsg}`,
                });
                if (terminalFailure) {
                    common_1.Logger.e(terminalFailure.message);
                    return {
                        success: false,
                        status: 'failure',
                        message: terminalFailure.message,
                        terminalFailure,
                        platform: this._config.platform,
                        startedAt,
                        completedAt: new Date().toISOString(),
                        steps: this._steps,
                        totalIterations: iteration,
                    };
                }
                continue;
            }
            const planningSpan = stepTrace.addSpanFromActivePhase(planningPhase, 'success');
            stepTrace.addSequentialTimings(this._plannerTraceToTimings(plannerResponse), { startMs: planningSpan.startMs });
            const action = plannerResponse.act;
            const reason = plannerResponse.reason;
            const naturalLanguageAction = plannerResponse.thought?.act ?? reason;
            common_1.Logger.i(`[${iteration}/${maxIterations}] \x1b[35mAction\x1b[0m: ${sanitizeLogField(action)} — ${sanitizeLogField(reason)}`);
            stepTrace.setAction(action);
            remember = plannerResponse.remember;
            if (action === common_1.PLANNER_ACTION_COMPLETED) {
                common_1.Logger.i('✓ Goal completed successfully!');
                const trace = this._emitTraceSummary(stepTrace);
                this._steps.push({
                    iteration,
                    action,
                    reason,
                    naturalLanguageAction,
                    analysis: plannerResponse.analysis,
                    thought: plannerResponse.thought,
                    actionPayload: this._buildActionPayload(plannerResponse),
                    success: true,
                    screenshot: deviceState.screenshot,
                    screenWidth: deviceState.screenWidth,
                    screenHeight: deviceState.screenHeight,
                    timestamp: new Date().toISOString(),
                    durationMs: trace.totalMs,
                    trace,
                });
                await onProgress?.({
                    type: 'goal_complete',
                    iteration,
                    totalIterations: maxIterations,
                    status: 'success',
                    action,
                    reason,
                    success: true,
                });
                return {
                    success: true,
                    status: 'success',
                    message: reason,
                    analysis: plannerResponse.analysis,
                    platform: this._config.platform,
                    startedAt,
                    completedAt: new Date().toISOString(),
                    steps: this._steps,
                    totalIterations: iteration,
                };
            }
            if (action === common_1.PLANNER_ACTION_FAILED) {
                common_1.Logger.w('✖ Goal failed: ' + reason);
                stepTrace.markFailure(reason);
                const trace = this._emitTraceSummary(stepTrace);
                this._steps.push({
                    iteration,
                    action,
                    reason,
                    naturalLanguageAction,
                    analysis: plannerResponse.analysis,
                    thought: plannerResponse.thought,
                    actionPayload: this._buildActionPayload(plannerResponse),
                    success: false,
                    screenshot: deviceState.screenshot,
                    screenWidth: deviceState.screenWidth,
                    screenHeight: deviceState.screenHeight,
                    timestamp: new Date().toISOString(),
                    durationMs: trace.totalMs,
                    trace,
                });
                await onProgress?.({
                    type: 'goal_complete',
                    iteration,
                    totalIterations: maxIterations,
                    status: 'failure',
                    action,
                    reason,
                    success: false,
                });
                return {
                    success: false,
                    status: 'failure',
                    message: reason,
                    analysis: plannerResponse.analysis,
                    platform: this._config.platform,
                    startedAt,
                    completedAt: new Date().toISOString(),
                    steps: this._steps,
                    totalIterations: iteration,
                };
            }
            await onProgress?.({
                type: 'executing',
                iteration,
                totalIterations: maxIterations,
                action,
                reason,
            });
            const actionPhase = (0, trace_js_1.startTracePhase)(iteration, 'action.total');
            const actionResult = await this._actionExecutor.executeAction({
                action,
                reason,
                text: plannerResponse.text,
                clearText: plannerResponse.clearText,
                direction: plannerResponse.direction,
                durationSeconds: plannerResponse.durationSeconds,
                url: plannerResponse.url,
                repeat: plannerResponse.repeat,
                delayBetweenTapMs: plannerResponse.delayBetweenTapMs,
                screenshot: deviceState.screenshot,
                hierarchy: deviceState.hierarchy,
                screenWidth: deviceState.screenWidth,
                screenHeight: deviceState.screenHeight,
                traceStep: iteration,
            });
            const actionSpan = stepTrace.addSpanFromActivePhase(actionPhase, actionResult.success ? 'success' : 'failure', actionResult.error);
            stepTrace.addSequentialTimings(actionResult.trace, {
                startMs: actionSpan.startMs,
            });
            if (actionResult.terminalFailure) {
                stepTrace.markFailure(actionResult.terminalFailure.message);
                const trace = this._emitTraceSummary(stepTrace);
                this._steps.push({
                    iteration,
                    action,
                    reason,
                    naturalLanguageAction,
                    analysis: plannerResponse.analysis,
                    thought: plannerResponse.thought,
                    actionPayload: this._buildActionPayload(plannerResponse),
                    success: false,
                    errorMessage: actionResult.terminalFailure.message,
                    screenshot: deviceState.screenshot,
                    screenWidth: deviceState.screenWidth,
                    screenHeight: deviceState.screenHeight,
                    timestamp: new Date().toISOString(),
                    durationMs: trace.totalMs,
                    trace,
                });
                common_1.Logger.e(actionResult.terminalFailure.message);
                await onProgress?.({
                    type: 'error',
                    iteration,
                    totalIterations: maxIterations,
                    message: actionResult.terminalFailure.message,
                });
                return {
                    success: false,
                    status: 'failure',
                    message: actionResult.terminalFailure.message,
                    terminalFailure: actionResult.terminalFailure,
                    analysis: plannerResponse.analysis,
                    platform: this._config.platform,
                    startedAt,
                    completedAt: new Date().toISOString(),
                    steps: this._steps,
                    totalIterations: iteration,
                };
            }
            const postCapturePhase = (0, trace_js_1.startTracePhase)(iteration, 'post_capture.total');
            const postActionCapture = await this._capturePostActionScreenshot(iteration);
            const postCaptureSpan = stepTrace.addSpanFromActivePhase(postCapturePhase, postActionCapture.status === 'success' ? 'success' : 'failure', postActionCapture.status === 'success' ? undefined : postActionCapture.message);
            stepTrace.addSequentialTimings(this._captureTraceToTimings(postActionCapture.captureTrace, 'post_capture'), {
                startMs: postCaptureSpan.startMs,
            });
            if (postActionCapture.status !== 'success') {
                common_1.Logger.w(`Post-action screenshot capture failed for iteration ${iteration}: ${postActionCapture.message ?? 'unknown capture error'}`);
            }
            // Aggregate LLM calls for this step: planner call + any grounder/visual-grounder
            // calls made by ActionExecutor. Order: planner first, then action calls.
            const stepLLMCalls = [];
            if (plannerResponse.llmCall) {
                stepLLMCalls.push(plannerResponse.llmCall);
            }
            if (actionResult.llmCalls && actionResult.llmCalls.length > 0) {
                stepLLMCalls.push(...actionResult.llmCalls);
            }
            const stepResult = {
                iteration,
                action,
                reason,
                naturalLanguageAction,
                analysis: plannerResponse.analysis,
                thought: plannerResponse.thought,
                actionPayload: this._buildActionPayload(plannerResponse),
                success: actionResult.success,
                errorMessage: actionResult.error,
                screenshot: postActionCapture.screenshot,
                screenWidth: postActionCapture.screenWidth ?? deviceState.screenWidth,
                screenHeight: postActionCapture.screenHeight ?? deviceState.screenHeight,
                timestamp: new Date().toISOString(),
                timing: actionResult.trace,
                ...(stepLLMCalls.length > 0 ? { llmCalls: stepLLMCalls } : {}),
            };
            if (!actionResult.success && actionResult.error) {
                stepTrace.markFailure(actionResult.error);
            }
            const trace = this._emitTraceSummary(stepTrace);
            stepResult.trace = trace;
            stepResult.durationMs = trace.totalMs;
            this._steps.push(stepResult);
            await onProgress?.({
                type: 'step_complete',
                iteration,
                totalIterations: maxIterations,
                action,
                reason,
                success: actionResult.success,
                message: actionResult.error,
                stepResult,
            });
            const statusText = actionResult.success ? 'SUCCESS' : `FAILED: ${actionResult.error}`;
            history += `${iteration}. [${action}] ${this._formatHistoryReason(plannerResponse)} → ${statusText}\n`;
        }
        common_1.Logger.w(`Max iterations (${maxIterations}) reached`);
        return {
            success: false,
            status: 'failure',
            message: `Max iterations (${maxIterations}) exceeded without completing the goal`,
            platform: this._config.platform,
            startedAt,
            completedAt: new Date().toISOString(),
            steps: this._steps,
            totalIterations: maxIterations,
        };
    }
    // ---------- private ----------
    async _captureDeviceState(traceStep) {
        try {
            const response = await this._config.agent.executeAction(new common_1.DeviceActionRequest({
                requestId: (0, node_crypto_1.randomUUID)(),
                action: new common_1.GetScreenshotAndHierarchyAction(),
                timeout: 30,
                shouldEnsureStability: true,
                traceStep,
            }));
            const captureTrace = response.data
                ? this._parseCaptureTrace(response.data['captureTrace'])
                : undefined;
            if (!response.success || !response.data) {
                const message = response.message ?? 'Failed to capture device state';
                return {
                    status: this._isTransientCaptureFailure(message) ? 'transient' : 'fatal',
                    message,
                    captureTrace,
                };
            }
            const data = response.data;
            const screenshot = data['screenshot'];
            const hierarchyStr = data['hierarchy'];
            const screenWidth = data['screenWidth'];
            const screenHeight = data['screenHeight'];
            if (!screenshot?.trim()) {
                return {
                    status: 'transient',
                    message: 'Empty screenshot from device capture',
                    captureTrace,
                };
            }
            if (!hierarchyStr?.trim()) {
                return {
                    status: 'transient',
                    message: 'Missing hierarchy from device capture',
                    captureTrace,
                };
            }
            const hierarchy = common_1.Hierarchy.fromJsonString(hierarchyStr);
            return {
                status: 'success',
                captureTrace,
                deviceState: {
                    screenshot,
                    hierarchy,
                    screenWidth,
                    screenHeight,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                status: this._isTransientCaptureFailure(message) ? 'transient' : 'fatal',
                message,
            };
        }
    }
    _emitTraceSummary(stepTrace) {
        const trace = stepTrace.build();
        common_1.Logger.d((0, trace_js_1.formatStepTraceSummary)(trace));
        return trace;
    }
    _captureTraceToTimings(captureTrace, prefix = 'capture') {
        if (!captureTrace) {
            return undefined;
        }
        const spans = [];
        if (captureTrace.stabilityMs !== undefined) {
            spans.push({
                name: `${prefix}.stability`,
                durationMs: captureTrace.stabilityMs,
                status: captureTrace.stable ? 'success' : 'failure',
                detail: `polls=${captureTrace.pollCount}`,
            });
        }
        spans.push({
            name: `${prefix}.final_payload`,
            durationMs: captureTrace.finalPayloadMs,
            status: captureTrace.failureReason ? 'failure' : 'success',
            detail: `attempts=${captureTrace.attempts}` +
                (captureTrace.failureReason ? ` reason=${captureTrace.failureReason}` : ''),
        });
        return {
            totalMs: captureTrace.totalMs,
            spans,
        };
    }
    async _capturePostActionScreenshot(traceStep) {
        try {
            const response = await this._config.agent.executeAction(new common_1.DeviceActionRequest({
                requestId: (0, node_crypto_1.randomUUID)(),
                action: new common_1.GetScreenshotAndHierarchyAction(),
                timeout: 30,
                shouldEnsureStability: true,
                traceStep,
            }));
            const captureTrace = response.data
                ? this._parseCaptureTrace(response.data['captureTrace'])
                : undefined;
            if (!response.success || !response.data) {
                const message = response.message ?? 'Failed to capture post-action screenshot';
                return {
                    status: this._isTransientCaptureFailure(message) ? 'transient' : 'fatal',
                    message,
                    captureTrace,
                };
            }
            const data = response.data;
            const screenshot = data['screenshot'];
            if (!screenshot?.trim()) {
                return {
                    status: 'transient',
                    message: 'Empty screenshot from post-action capture',
                    captureTrace,
                };
            }
            return {
                status: 'success',
                screenshot,
                screenWidth: typeof data['screenWidth'] === 'number'
                    ? data['screenWidth']
                    : undefined,
                screenHeight: typeof data['screenHeight'] === 'number'
                    ? data['screenHeight']
                    : undefined,
                captureTrace,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                status: this._isTransientCaptureFailure(message) ? 'transient' : 'fatal',
                message,
            };
        }
    }
    _plannerTraceToTimings(plannerResponse) {
        if (!plannerResponse.trace) {
            return undefined;
        }
        return {
            totalMs: plannerResponse.trace.totalMs,
            spans: [
                {
                    name: 'planning.llm',
                    durationMs: plannerResponse.trace.promptBuildMs + plannerResponse.trace.llmMs,
                    status: 'success',
                    detail: `prompt=${plannerResponse.trace.promptBuildMs}ms ` +
                        `model=${plannerResponse.trace.llmMs}ms`,
                },
                {
                    name: 'planning.parse',
                    durationMs: plannerResponse.trace.parseMs,
                    status: 'success',
                },
            ],
        };
    }
    _parseCaptureTrace(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return undefined;
        }
        const record = value;
        const totalMs = toNumber(record['totalMs']);
        const finalPayloadMs = toNumber(record['finalPayloadMs']);
        if (totalMs === undefined || finalPayloadMs === undefined) {
            return undefined;
        }
        return {
            totalMs,
            stabilityMs: toNumber(record['stabilityMs']),
            finalPayloadMs,
            stable: Boolean(record['stable']),
            pollCount: toNumber(record['pollCount']) ?? 0,
            attempts: toNumber(record['attempts']) ?? 0,
            failureReason: typeof record['failureReason'] === 'string'
                ? record['failureReason']
                : undefined,
        };
    }
    _isTransientCaptureFailure(message) {
        const normalized = message.toLowerCase();
        return (normalized.includes('uiautomation not connected') ||
            normalized.includes('unavailable') ||
            normalized.includes('no connection established') ||
            normalized.includes('empty screenshot') ||
            normalized.includes('missing hierarchy') ||
            normalized.includes('invalid hierarchy'));
    }
    _formatHistoryReason(plannerResponse) {
        const details = [];
        if (plannerResponse.text) {
            details.push(`text="${plannerResponse.text}"`);
        }
        if (plannerResponse.direction) {
            details.push(`direction=${plannerResponse.direction}`);
        }
        if (plannerResponse.durationSeconds !== undefined) {
            details.push(`duration=${plannerResponse.durationSeconds}s`);
        }
        if (plannerResponse.url) {
            details.push(`url=${plannerResponse.url}`);
        }
        if (plannerResponse.repeat !== undefined) {
            details.push(`repeat=${plannerResponse.repeat}`);
        }
        if (plannerResponse.delayBetweenTapMs !== undefined) {
            details.push(`delayBetweenTapMs=${plannerResponse.delayBetweenTapMs}`);
        }
        if (details.length === 0) {
            return plannerResponse.reason;
        }
        return `${plannerResponse.reason} (${details.join(', ')})`;
    }
    _buildActionPayload(plannerResponse) {
        const payload = {
            text: plannerResponse.text,
            url: plannerResponse.url,
            direction: plannerResponse.direction,
            clearText: plannerResponse.clearText,
            durationSeconds: plannerResponse.durationSeconds,
            repeat: plannerResponse.repeat,
            delayBetweenTapMs: plannerResponse.delayBetweenTapMs,
        };
        return Object.values(payload).some((value) => value !== undefined)
            ? payload
            : undefined;
    }
}
exports.TestExecutor = TestExecutor;
function toNumber(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return undefined;
    }
    return Math.max(0, Math.round(value));
}
//# sourceMappingURL=TestExecutor.js.map