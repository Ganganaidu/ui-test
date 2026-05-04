import { DeviceAgent, Hierarchy, type RuntimeBindings } from '@usb-ui-test/common';
import { AIAgent } from './ai/AIAgent.js';
import { type TerminalFailureSignal } from './ai/providerFailure.js';
import { type LLMCallTrace, type TimingMetadata } from './trace.js';
export interface ActionInput {
    action: string;
    reason: string;
    text?: string;
    clearText?: boolean;
    direction?: string;
    durationSeconds?: number;
    url?: string;
    repeat?: number;
    delayBetweenTapMs?: number;
    screenshot?: string;
    hierarchy?: Hierarchy;
    screenWidth: number;
    screenHeight: number;
    traceStep?: number;
}
export interface ActionOutput {
    success: boolean;
    error?: string;
    trace?: TimingMetadata;
    terminalFailure?: TerminalFailureSignal;
    /** Raw LLM calls made during this action (grounder + visual grounder). Forwarded to observability. */
    llmCalls?: LLMCallTrace[];
}
/**
 * Executes individual actions: ground UI element → compute coordinates → device action.
 *
 */
export declare class ActionExecutor {
    private _agent;
    private _aiAgent;
    private _visualGrounder;
    private _platform;
    private _appIdentifier?;
    private _runtimeBindings?;
    private _logContext?;
    constructor(params: {
        agent: DeviceAgent;
        aiAgent: AIAgent;
        platform: string;
        appIdentifier?: string;
        runtimeBindings?: RuntimeBindings;
        /** Attached to every grounder log line. See TestExecutorConfig.logContext. */
        logContext?: string;
    });
    /**
     * Execute an action based on the planner's output.
     * Routes to the correct handler based on action type.
     */
    executeAction(input: ActionInput): Promise<ActionOutput>;
    private _executeTap;
    private _executeLongPress;
    private _executeType;
    private _executeScroll;
    private _executePressEnter;
    private _executeLaunchApp;
    private _executeSetLocation;
    private _executeWait;
    private _executeDeeplink;
    private _executeSimpleAction;
    private _executeSingleDevicePhase;
    private _groundToPoint;
    private _executeVisualGroundingFallback;
    private _executeDeviceAction;
    private _callGrounder;
    private _runTimedPhase;
    private _pushGroundSpan;
    private _groundStatus;
    private _llmTraceToSpan;
    private _composeDetail;
    private _groundTraceDetail;
    private _success;
    private _failure;
    private _buildTrace;
    private _mergeTrace;
    private _redactRuntimeString;
    private _delay;
}
//# sourceMappingURL=ActionExecutor.d.ts.map