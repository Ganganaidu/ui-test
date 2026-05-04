import type { AgentActionTrace, TraceSpan as CommonTraceSpan, SpanTiming as CommonSpanTiming, TimingInfo } from '@usb-ui-test/common';
export type TraceStatus = 'success' | 'failure';
export type TraceSpan = CommonTraceSpan;
export type StepTrace = AgentActionTrace;
export type SpanTiming = CommonSpanTiming;
export type TimingMetadata = TimingInfo;
export interface LLMTrace {
    totalMs: number;
    promptBuildMs: number;
    llmMs: number;
    parseMs: number;
}
/**
 * Per-LLM-call observability data — prompt, response, tokens, timing.
 * Populated in AIAgent._callLLM() and bubbled up to TestExecutor so
 * downstream consumers can forward to observability backends
 * (e.g., Langfuse) without the agent itself depending on any SDK.
 *
 * Field names mirror Langfuse's canonical ingestion schema to make
 * forwarding a straight pass-through on the consumer side.
 */
export interface LLMCallTrace {
    /** AI provider: 'openai' | 'google' | 'anthropic'. */
    provider: string;
    /** Full model name, e.g. 'gpt-4.1-mini', 'gemini-2.0-flash'. */
    model: string;
    /** Logical feature the call served: 'planner', 'grounder', 'visual_grounder', etc. */
    feature: string;
    /** Full prompt as the provider saw it — array of role/content messages (includes any base64 images inline). */
    prompt: unknown;
    /** Raw model response text. */
    completion: string;
    /** Normalized token counts (Langfuse canonical names — input/output/total). */
    usage: {
        input: number;
        output: number;
        total: number;
        /** Only present if the provider reported cache-read input tokens > 0. */
        input_cached_tokens?: number;
    };
    /** ISO-8601 timestamp when the call started. */
    startedAt: string;
    /** ISO-8601 timestamp when the call returned or errored. */
    completedAt: string;
    /** Wall-clock duration of the LLM call in ms. */
    durationMs: number;
    /** Provider error message, if the call threw. */
    statusMessage?: string;
}
export interface ActiveTracePhase {
    phase: string;
    startedAt: number;
    step: number;
}
export declare function nowMs(): number;
export declare function roundDuration(durationMs: number): number;
export declare function startTracePhase(step: number | undefined, phase: string, detail?: string): ActiveTracePhase | null;
export declare function finishTracePhase(activePhase: ActiveTracePhase | null, status: TraceStatus, detail?: string): number;
export declare function describeLLMTrace(params: {
    promptBuildMs: number;
    llmMs: number;
    parseMs?: number;
    extraDetail?: string;
}): string;
export declare class StepTraceBuilder {
    private readonly _step;
    private readonly _stepStartedAt;
    private readonly _spans;
    private _action;
    private _status;
    private _failureReason;
    constructor(step: number);
    setAction(action: string): void;
    markFailure(reason: string): void;
    addSpanFromActivePhase(phase: ActiveTracePhase | null, status: TraceStatus, detail?: string): TraceSpan;
    addSpan(name: string, durationMs: number, status: TraceStatus, options?: {
        startMs?: number;
        detail?: string;
    }): TraceSpan;
    addSequentialTimings(timings: TimingMetadata | undefined, options?: {
        startMs?: number;
    }): void;
    build(): StepTrace;
    private _nextSequentialStartMs;
}
export declare function formatStepTraceSummary(stepTrace: StepTrace): string;
export declare function formatPlannerReasoning(params: {
    step: number;
    thought?: {
        plan?: string;
        think?: string;
        act?: string;
    };
    action: string;
    reason: string;
}): string;
export declare function formatGrounderRequest(params: {
    step: number;
    feature: string;
    act: string;
}): string;
export declare function formatGrounderResult(params: {
    step: number;
    output: Record<string, unknown>;
    bounds?: [number, number, number, number] | null;
}): string;
//# sourceMappingURL=trace.d.ts.map