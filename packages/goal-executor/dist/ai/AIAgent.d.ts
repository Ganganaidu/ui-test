import { Hierarchy, type FeatureName, type FeatureOverrides, type ModelDefaults } from '@usb-ui-test/common';
import { type LLMTrace, type LLMCallTrace } from '../trace.js';
export interface PlannerRequest {
    testObjective: string;
    platform: string;
    preActionScreenshot?: string;
    postActionScreenshot?: string;
    hierarchy?: Hierarchy;
    history?: string;
    remember?: string[];
    preContext?: string;
    appKnowledge?: string;
    postActionHierarchy?: Hierarchy;
    traceStep?: number;
    /**
     * Free-form label used only for logging (e.g. "primary(Pixel_10) step=3").
     * Helps distinguish which device/step a plan call belongs to in multi-device runs.
     */
    logContext?: string;
}
export interface PlannerResponse {
    act: string;
    reason: string;
    remember: string[];
    text?: string;
    clearText?: boolean;
    direction?: string;
    durationSeconds?: number;
    url?: string;
    result?: string;
    analysis?: string;
    severity?: string;
    repeat?: number;
    delayBetweenTapMs?: number;
    thought?: {
        plan?: string;
        think?: string;
        act?: string;
    };
    trace?: LLMTrace;
    /** Raw LLM call trace captured during planning — forwarded to observability. */
    llmCall?: LLMCallTrace;
}
export interface GrounderRequest {
    feature: FeatureName;
    act: string;
    hierarchy?: Hierarchy;
    screenshot?: string;
    platform?: string;
    availableApps?: Array<{
        packageName: string;
        name: string;
    }>;
    traceStep?: number;
    tracePhase?: string;
    /**
     * Free-form label used only for logging (e.g. "primary(Pixel_10) step=3").
     */
    logContext?: string;
}
export interface GrounderResponse {
    output: Record<string, unknown>;
    raw: string;
    trace?: LLMTrace;
    /** Raw LLM call trace captured during grounding — forwarded to observability. */
    llmCall?: LLMCallTrace;
}
/**
 * Handles all AI interactions — planning and grounding.
 * Replaces UsbUiTestAgent.dart, calling LLMs directly via Vercel AI SDK.
 *
 * Dart equivalent: UsbUiTestAgent in goal_executor/lib/src/UsbUiTestAgent.dart
 */
export declare class AIAgent {
    private _apiKeys;
    private _defaults;
    private _features;
    private _promptCache;
    private _clientCache;
    constructor(params: {
        apiKeys: Record<string, string>;
        defaults: ModelDefaults;
        features?: FeatureOverrides;
    });
    /**
     * Call the AI planner to decide the next action.
     *
     * Dart: Future<Map<String, dynamic>> plan(...)
     */
    plan(request: PlannerRequest): Promise<PlannerResponse>;
    /**
     * Call the AI grounder to find an element on screen.
     *
     * Dart: Future<Map<String, dynamic>> ground(...)
     */
    ground(request: GrounderRequest): Promise<GrounderResponse>;
    /**
     * Call an LLM via Vercel AI SDK. Uses Output.json() so the provider emits
     * strict JSON (Google response_mime_type, OpenAI response_format, Anthropic
     * structuredOutputMode), matching the Kotlin backend's behavior.
     */
    private _callLLM;
    /**
     * Resolve the effective provider / model / reasoning for a feature by
     * merging the optional per-feature override on top of workspace defaults.
     */
    private _resolveFeatureConfig;
    /**
     * Create (or reuse a cached) Vercel AI SDK model instance for the
     * resolved provider/modelName.
     */
    private _getModel;
    private _getProviderOptions;
    /**
     * Load a system prompt from the bundled .md files.
     */
    private _loadPrompt;
    /**
     * Map feature name to prompt file name.
     */
    private _getPromptKeyForFeature;
    /**
     * Parse the planner LLM response into PlannerResponse. The SDK has already
     * parsed the JSON via Output.json(), so we just normalize the shape.
     */
    private _parsePlannerResponse;
    /**
     * Parse the grounder LLM response into GrounderResponse. The SDK has already
     * parsed the JSON via Output.json(), so we just unwrap the `output` key when
     * present.
     */
    private _parseGrounderResponse;
    private _summarizePlannerRequest;
    private _summarizeGrounderRequest;
    private _detailPlannerRequest;
    private _detailGrounderRequest;
    private _formatLogContext;
    private _screenshotMetric;
    private _countHistoryLines;
}
//# sourceMappingURL=AIAgent.d.ts.map