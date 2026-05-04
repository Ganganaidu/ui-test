"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepTraceBuilder = void 0;
exports.nowMs = nowMs;
exports.roundDuration = roundDuration;
exports.startTracePhase = startTracePhase;
exports.finishTracePhase = finishTracePhase;
exports.describeLLMTrace = describeLLMTrace;
exports.formatStepTraceSummary = formatStepTraceSummary;
exports.formatPlannerReasoning = formatPlannerReasoning;
exports.formatGrounderRequest = formatGrounderRequest;
exports.formatGrounderResult = formatGrounderResult;
const node_perf_hooks_1 = require("node:perf_hooks");
const common_1 = require("@usb-ui-test/common");
const SUMMARY_GROUPS = [
    {
        group: 'capture.total',
        label: 'capture',
        children: ['capture.stability', 'capture.final_payload'],
    },
    {
        group: 'planning.total',
        label: 'planning',
        children: ['planning.llm', 'planning.parse'],
    },
    {
        group: 'action.total',
        label: 'action',
        children: [
            'action.prep',
            'action.ground',
            'action.visual_fallback',
            'action.device',
            'action.wait',
        ],
    },
    {
        group: 'post_capture.total',
        label: 'post_capture',
        children: ['post_capture.stability', 'post_capture.final_payload'],
    },
];
function nowMs() {
    return node_perf_hooks_1.performance.now();
}
function roundDuration(durationMs) {
    return Math.max(0, Math.round(durationMs));
}
function startTracePhase(step, phase, detail) {
    if (step !== undefined) {
        common_1.Logger.d(`[trace step=${step} phase=${phase}] start${formatDetail(detail)}`);
    }
    return step !== undefined
        ? {
            phase,
            startedAt: nowMs(),
            step,
        }
        : null;
}
function finishTracePhase(activePhase, status, detail) {
    const finishedAt = nowMs();
    const durationMs = activePhase
        ? roundDuration(finishedAt - activePhase.startedAt)
        : 0;
    if (activePhase) {
        common_1.Logger.d(`[trace step=${activePhase.step} phase=${activePhase.phase}] done duration=${durationMs}ms status=${status}${formatDetail(detail)}`);
    }
    return durationMs;
}
function describeLLMTrace(params) {
    const parts = [
        `prompt=${params.promptBuildMs}ms`,
        `model=${params.llmMs}ms`,
    ];
    if (params.parseMs !== undefined) {
        parts.push(`parse=${params.parseMs}ms`);
    }
    if (params.extraDetail) {
        parts.push(params.extraDetail);
    }
    return parts.join(' ');
}
class StepTraceBuilder {
    _step;
    _stepStartedAt;
    _spans = [];
    _action = 'pending';
    _status = 'success';
    _failureReason;
    constructor(step) {
        this._step = step;
        this._stepStartedAt = nowMs();
    }
    setAction(action) {
        this._action = action;
    }
    markFailure(reason) {
        this._status = 'failure';
        this._failureReason = collapseWhitespace(reason);
    }
    addSpanFromActivePhase(phase, status, detail) {
        const durationMs = finishTracePhase(phase, status, detail);
        const startedAt = phase?.startedAt ?? nowMs();
        const span = {
            name: phase?.phase ?? 'unknown',
            startMs: roundDuration(startedAt - this._stepStartedAt),
            durationMs,
            status,
            detail: detail ? collapseWhitespace(detail) : undefined,
        };
        this._spans.push(span);
        return span;
    }
    addSpan(name, durationMs, status, options) {
        const span = {
            name,
            startMs: options?.startMs ??
                this._nextSequentialStartMs(),
            durationMs: roundDuration(durationMs),
            status,
            detail: options?.detail ? collapseWhitespace(options.detail) : undefined,
        };
        this._spans.push(span);
        return span;
    }
    addSequentialTimings(timings, options) {
        if (!timings) {
            return;
        }
        let cursor = options?.startMs ?? this._nextSequentialStartMs();
        for (const span of timings.spans) {
            this.addSpan(span.name, span.durationMs, span.status, {
                startMs: cursor,
                detail: span.detail,
            });
            cursor += roundDuration(span.durationMs);
        }
    }
    build() {
        const totalMs = roundDuration(nowMs() - this._stepStartedAt);
        return {
            step: this._step,
            action: this._action,
            status: this._status,
            totalMs,
            spans: [
                {
                    name: 'step.total',
                    startMs: 0,
                    durationMs: totalMs,
                    status: this._status,
                    detail: this._failureReason,
                },
                ...this._spans.sort((left, right) => left.startMs - right.startMs),
            ],
            failureReason: this._failureReason,
        };
    }
    _nextSequentialStartMs() {
        if (this._spans.length === 0) {
            return 0;
        }
        const lastSpan = this._spans[this._spans.length - 1];
        return lastSpan.startMs + lastSpan.durationMs;
    }
}
exports.StepTraceBuilder = StepTraceBuilder;
function formatStepTraceSummary(stepTrace) {
    const spanMap = new Map(stepTrace.spans.map((span) => [span.name, span]));
    const parts = [`summary total=${stepTrace.totalMs}ms`];
    for (const group of SUMMARY_GROUPS) {
        const groupSpan = spanMap.get(group.group);
        if (!groupSpan) {
            continue;
        }
        const childSummaries = group.children
            .map((childName) => spanMap.get(childName))
            .filter((childSpan) => childSpan !== undefined)
            .map((childSpan) => `${stripPrefix(childSpan.name)}=${childSpan.durationMs}ms`);
        if (childSummaries.length > 0) {
            parts.push(`${group.label}=${groupSpan.durationMs}ms(${childSummaries.join(',')})`);
        }
        else {
            parts.push(`${group.label}=${groupSpan.durationMs}ms`);
        }
    }
    parts.push(`result=${stepTrace.status}`);
    parts.push(`action=${stepTrace.action}`);
    if (stepTrace.failureReason) {
        parts.push(`reason=${JSON.stringify(stepTrace.failureReason)}`);
    }
    return `[trace step=${stepTrace.step}] ${parts.join(' ')}`;
}
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';
function formatPlannerReasoning(params) {
    const lines = [
        `[step ${params.step}] ${BLUE}Planner${RESET} → ${params.action}`,
    ];
    if (params.thought?.plan) {
        lines.push(`  Plan: ${params.thought.plan}`);
    }
    if (params.thought?.think) {
        lines.push(`  ${BLUE}Think${RESET}: ${params.thought.think}`);
    }
    if (!params.thought) {
        lines.push(`  Reason: ${params.reason}`);
    }
    return lines.join('\n');
}
function formatGrounderRequest(params) {
    return `[step ${params.step}] ${YELLOW}Grounding${RESET} → feature=${params.feature} act="${params.act}"`;
}
function formatGrounderResult(params) {
    const { output } = params;
    if (output['isError']) {
        return `[step ${params.step}] ${RED}Grounded${RESET} → ${RED}error: ${output['reason'] ?? 'unknown'}${RESET}`;
    }
    if (output['needsVisualGrounding']) {
        return `[step ${params.step}] ${YELLOW}Grounded${RESET} → needsVisualGrounding`;
    }
    if (typeof output['index'] === 'number') {
        const boundsStr = params.bounds
            ? ` bounds=[${params.bounds.join(',')}]`
            : '';
        return `[step ${params.step}] ${GREEN}Grounded${RESET} → index=${output['index']}${boundsStr} reason="${output['reason'] ?? ''}"`;
    }
    if (typeof output['x'] === 'number' && typeof output['y'] === 'number') {
        return `[step ${params.step}] ${GREEN}Grounded${RESET} → x=${output['x']} y=${output['y']}`;
    }
    return `[step ${params.step}] ${GREEN}Grounded${RESET} → ${JSON.stringify(output)}`;
}
function formatDetail(detail) {
    if (!detail) {
        return '';
    }
    return ` detail=${JSON.stringify(collapseWhitespace(detail))}`;
}
function stripPrefix(value) {
    const slashIndex = value.indexOf('.');
    return slashIndex === -1 ? value : value.slice(slashIndex + 1);
}
function collapseWhitespace(value) {
    return value.replace(/\s+/g, ' ').trim();
}
//# sourceMappingURL=trace.js.map