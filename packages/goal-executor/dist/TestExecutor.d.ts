import { DeviceAgent, type ActionPayload, type PlannerThought, type RuntimeBindings } from '@usb-ui-test/common';
import { AIAgent } from './ai/AIAgent.js';
import { type TerminalFailureSignal } from './ai/providerFailure.js';
import { type StepTrace, type TimingMetadata, type LLMCallTrace } from './trace.js';
export interface TestExecutorConfig {
    goal: string;
    platform: string;
    maxIterations?: number;
    agent: DeviceAgent;
    aiAgent: AIAgent;
    preContext?: string;
    appKnowledge?: string;
    appIdentifier?: string;
    runtimeBindings?: RuntimeBindings;
    /**
     * Free-form label attached to every planner/grounder log line for this run.
     * Typically a device serial. Helps distinguish concurrent/sequential runs
     * in the logs.
     */
    logContext?: string;
}
export interface AgentActionResult {
    iteration: number;
    action: string;
    reason: string;
    naturalLanguageAction?: string;
    analysis?: string;
    thought?: PlannerThought;
    actionPayload?: ActionPayload;
    success: boolean;
    errorMessage?: string;
    screenshot?: string;
    screenWidth?: number;
    screenHeight?: number;
    timestamp?: string;
    durationMs?: number;
    timing?: TimingMetadata;
    trace?: StepTrace;
    /**
     * Raw LLM call traces that happened during this step (planner + any
     * grounder / visual grounder calls). Consumers can forward these to
     * observability backends (e.g., Langfuse). Empty for steps with no
     * LLM activity.
     */
    llmCalls?: LLMCallTrace[];
}
export interface TestRecordingResult {
    filePath: string;
    startedAt: string;
    completedAt?: string;
}
export type ExecutionStatus = 'success' | 'failure' | 'aborted';
export interface TestExecutionResult {
    success: boolean;
    status: ExecutionStatus;
    message: string;
    terminalFailure?: TerminalFailureSignal;
    analysis?: string;
    platform: string;
    startedAt: string;
    completedAt: string;
    recording?: TestRecordingResult;
    deviceLog?: import('@usb-ui-test/common').DeviceLogCaptureResult;
    steps: AgentActionResult[];
    totalIterations: number;
}
/**
 * Progress callback — called on each iteration. Supports both sync (CLI
 * terminal renderer) and async persistence consumers.
 * The executor awaits the callback so async consumers can safely perform
 * I/O (S3 uploads, DB writes) before the next iteration starts.
 */
export type ExecutionProgressCallback = (event: ExecutionProgressEvent) => void | Promise<void>;
export interface ExecutionProgressEvent {
    type: 'planning' | 'executing' | 'step_complete' | 'goal_complete' | 'error';
    iteration: number;
    totalIterations: number;
    status?: ExecutionStatus;
    action?: string;
    reason?: string;
    success?: boolean;
    message?: string;
    /** Full step result — available on `step_complete` events. */
    stepResult?: AgentActionResult;
}
/**
 * Orchestrates the full goal execution loop:
 *   1. Capture device state (screenshot + hierarchy)
 *   2. Call AI planner → get next action
 *   3. Execute action via ActionExecutor
 *   4. Record result, check for done/failure
 *   5. Repeat
 *
 */
export declare class TestExecutor {
    private _config;
    private _actionExecutor;
    private _aborted;
    private _steps;
    constructor(config: TestExecutorConfig);
    /**
     * Abort the goal execution.
     * The loop will stop after the current iteration completes.
     */
    abort(): void;
    /**
     * Backward-compatible alias for abort().
     */
    cancel(): void;
    /**
     * Execute the goal. Main entry point.
     */
    executeGoal(onProgress?: ExecutionProgressCallback): Promise<TestExecutionResult>;
    private _captureDeviceState;
    private _emitTraceSummary;
    private _captureTraceToTimings;
    private _capturePostActionScreenshot;
    private _plannerTraceToTimings;
    private _parseCaptureTrace;
    private _isTransientCaptureFailure;
    private _formatHistoryReason;
    private _buildActionPayload;
}
//# sourceMappingURL=TestExecutor.d.ts.map