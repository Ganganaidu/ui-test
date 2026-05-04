"use strict";
// AIAgent.ts — Replaces UsbUiTestAgent.dart
// Uses Vercel AI SDK for direct LLM calls instead of backend API.
// Dart: UsbUiTestAgent → TypeScript: AIAgent
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgent = void 0;
const ai_1 = require("ai");
const openai_1 = require("@ai-sdk/openai");
const google_1 = require("@ai-sdk/google");
const anthropic_1 = require("@ai-sdk/anthropic");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_perf_hooks_1 = require("node:perf_hooks");
const common_1 = require("@usb-ui-test/common");
const trace_js_1 = require("../trace.js");
const providerFailure_js_1 = require("./providerFailure.js");
const schemas_js_1 = require("./schemas.js");
/** Fallback reasoning levels used when neither feature override nor workspace default is set. */
const DEFAULT_REASONING_BY_PHASE = {
    planner: 'medium',
    grounder: 'low',
};
/** Map a feature to its phase (controls token budget + default reasoning). */
function phaseForFeature(feature) {
    return feature === common_1.FEATURE_PLANNER ? 'planner' : 'grounder';
}
const MAX_LLM_ATTEMPTS = 2;
// ============================================================================
// AIAgent
// ============================================================================
/**
 * Handles all AI interactions — planning and grounding.
 * Replaces UsbUiTestAgent.dart, calling LLMs directly via Vercel AI SDK.
 *
 * Dart equivalent: UsbUiTestAgent in goal_executor/lib/src/UsbUiTestAgent.dart
 */
class AIAgent {
    _apiKeys;
    _defaults;
    _features;
    // Cached prompt contents
    _promptCache = new Map();
    // Cached Vercel AI SDK clients, keyed by provider
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _clientCache = new Map();
    constructor(params) {
        this._apiKeys = params.apiKeys;
        this._defaults = params.defaults;
        this._features = params.features ?? {};
    }
    /**
     * Call the AI planner to decide the next action.
     *
     * Dart: Future<Map<String, dynamic>> plan(...)
     */
    async plan(request) {
        const promptBuildStartedAt = node_perf_hooks_1.performance.now();
        const systemPrompt = this._loadPrompt('planner');
        const userParts = [];
        if (request.preActionScreenshot) {
            userParts.push({ type: 'image', image: request.preActionScreenshot });
        }
        let textPrompt = `Test objective: ${request.testObjective}\n`;
        textPrompt += `Platform: ${request.platform}\n`;
        if (request.history) {
            textPrompt += `\nHistory of actions taken so far:\n${request.history}\n`;
        }
        if (request.remember && request.remember.length > 0) {
            textPrompt += `\nImportant context to remember:\n${JSON.stringify(request.remember)}\n`;
        }
        if (request.preContext) {
            textPrompt += `\nPre-context:\n${request.preContext}\n`;
        }
        if (request.appKnowledge) {
            textPrompt += `\nApp knowledge:\n${request.appKnowledge}\n`;
        }
        if (request.hierarchy) {
            const elements = request.hierarchy.toPromptElementsForPlanner(request.platform);
            textPrompt += `\nui_elements:\n${JSON.stringify(elements)}\n`;
        }
        if (request.postActionScreenshot) {
            userParts.push({ type: 'image', image: request.postActionScreenshot });
        }
        if (request.postActionHierarchy) {
            const postElements = request.postActionHierarchy.toPromptElementsForPlanner(request.platform);
            textPrompt += `\nPost-action ui_elements:\n${JSON.stringify(postElements)}\n`;
        }
        userParts.push({ type: 'text', text: textPrompt });
        const promptBuildMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - promptBuildStartedAt);
        // Input visibility: one INFO summary line + one DEBUG detail blob per plan call.
        common_1.Logger.i(this._summarizePlannerRequest(request));
        common_1.Logger.d(this._detailPlannerRequest(request, textPrompt));
        const maxAttempts = MAX_LLM_ATTEMPTS;
        let lastError;
        let parsedResponse;
        let llmMs = 0;
        let parseMs = 0;
        let lastLLMCall;
        const plannerResolved = this._resolveFeatureConfig(common_1.FEATURE_PLANNER);
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const llmPhase = (0, trace_js_1.startTracePhase)(request.traceStep, 'planning.llm', `provider=${plannerResolved.provider} model=${plannerResolved.modelName} attempt=${attempt}/${maxAttempts}`);
            const llmStartedAt = node_perf_hooks_1.performance.now();
            let rawOutput;
            let rawText;
            try {
                const llmResult = await this._callLLM(systemPrompt, userParts, common_1.FEATURE_PLANNER);
                rawOutput = llmResult.output;
                rawText = llmResult.text;
                lastLLMCall = llmResult.llmCall;
            }
            catch (error) {
                (0, trace_js_1.finishTracePhase)(llmPhase, 'failure', error instanceof Error ? error.message : String(error));
                if (providerFailure_js_1.FatalProviderError.isInstance(error)) {
                    throw error;
                }
                lastError = error;
                if (attempt < maxAttempts) {
                    common_1.Logger.w(`Planner attempt ${attempt}/${maxAttempts} failed (llm), retrying: ${error instanceof Error ? error.message : String(error)}`);
                    continue;
                }
                throw error;
            }
            llmMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - llmStartedAt);
            (0, trace_js_1.finishTracePhase)(llmPhase, 'success', (0, trace_js_1.describeLLMTrace)({ promptBuildMs, llmMs }));
            const parsePhase = (0, trace_js_1.startTracePhase)(request.traceStep, 'planning.parse', `attempt=${attempt}/${maxAttempts}`);
            const parseStartedAt = node_perf_hooks_1.performance.now();
            try {
                parsedResponse = this._parsePlannerResponse(rawOutput, rawText);
                parseMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - parseStartedAt);
                (0, trace_js_1.finishTracePhase)(parsePhase, 'success');
                break;
            }
            catch (error) {
                (0, trace_js_1.finishTracePhase)(parsePhase, 'failure', error instanceof Error ? error.message : String(error));
                lastError = error;
                if (attempt < maxAttempts) {
                    common_1.Logger.w(`Planner attempt ${attempt}/${maxAttempts} failed (parse), retrying: ${error instanceof Error ? error.message : String(error)}`);
                    continue;
                }
                throw error;
            }
        }
        if (!parsedResponse) {
            throw lastError ?? new Error('Planner failed after all retry attempts');
        }
        if (request.traceStep !== undefined) {
            common_1.Logger.i((0, trace_js_1.formatPlannerReasoning)({
                step: request.traceStep,
                thought: parsedResponse.thought,
                action: parsedResponse.act,
                reason: parsedResponse.reason,
            }));
        }
        return {
            ...parsedResponse,
            trace: {
                totalMs: promptBuildMs + llmMs + parseMs,
                promptBuildMs,
                llmMs,
                parseMs,
            },
            ...(lastLLMCall ? { llmCall: lastLLMCall } : {}),
        };
    }
    /**
     * Call the AI grounder to find an element on screen.
     *
     * Dart: Future<Map<String, dynamic>> ground(...)
     */
    async ground(request) {
        if (request.traceStep !== undefined) {
            common_1.Logger.i((0, trace_js_1.formatGrounderRequest)({
                step: request.traceStep,
                feature: request.feature,
                act: request.act,
            }));
        }
        const phaseName = request.tracePhase ?? 'action.ground';
        const promptBuildStartedAt = node_perf_hooks_1.performance.now();
        const promptKey = this._getPromptKeyForFeature(request.feature);
        const systemPrompt = this._loadPrompt(promptKey);
        const userParts = [];
        if (request.screenshot) {
            userParts.push({ type: 'image', image: request.screenshot });
        }
        let text = `act: ${request.act}\n`;
        if (request.platform) {
            text += `platform: ${request.platform}\n`;
        }
        if (request.hierarchy) {
            const elements = request.hierarchy.toPromptElementsForGrounder(request.platform);
            text += `\nui_elements:\n${JSON.stringify(elements)}\n`;
        }
        if (request.availableApps) {
            text += `\navailable_apps:\n${JSON.stringify(request.availableApps)}\n`;
        }
        userParts.push({ type: 'text', text });
        const promptBuildMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - promptBuildStartedAt);
        // Input visibility: one INFO summary line + one DEBUG detail blob per grounder call.
        common_1.Logger.i(this._summarizeGrounderRequest(request));
        common_1.Logger.d(this._detailGrounderRequest(request, text));
        const maxAttempts = MAX_LLM_ATTEMPTS;
        let lastError;
        let parsed;
        let llmMs = 0;
        let parseMs = 0;
        let lastLLMCall;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const phase = (0, trace_js_1.startTracePhase)(request.traceStep, phaseName, `feature=${request.feature} attempt=${attempt}/${maxAttempts}`);
            const llmStartedAt = node_perf_hooks_1.performance.now();
            let rawOutput;
            let rawText;
            try {
                const llmResult = await this._callLLM(systemPrompt, userParts, request.feature);
                rawOutput = llmResult.output;
                rawText = llmResult.text;
                lastLLMCall = llmResult.llmCall;
            }
            catch (error) {
                (0, trace_js_1.finishTracePhase)(phase, 'failure', error instanceof Error ? error.message : String(error));
                if (providerFailure_js_1.FatalProviderError.isInstance(error)) {
                    throw error;
                }
                lastError = error;
                if (attempt < maxAttempts) {
                    common_1.Logger.w(`Grounder attempt ${attempt}/${maxAttempts} failed (llm) for feature=${request.feature}, retrying: ${error instanceof Error ? error.message : String(error)}`);
                    continue;
                }
                throw error;
            }
            llmMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - llmStartedAt);
            const parseStartedAt = node_perf_hooks_1.performance.now();
            try {
                parsed = this._parseGrounderResponse(rawOutput, rawText);
                parseMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - parseStartedAt);
                (0, trace_js_1.finishTracePhase)(phase, 'success', (0, trace_js_1.describeLLMTrace)({
                    promptBuildMs,
                    llmMs,
                    parseMs,
                    extraDetail: `feature=${request.feature}`,
                }));
                break;
            }
            catch (error) {
                (0, trace_js_1.finishTracePhase)(phase, 'failure', error instanceof Error ? error.message : String(error));
                lastError = error;
                if (attempt < maxAttempts) {
                    common_1.Logger.w(`Grounder attempt ${attempt}/${maxAttempts} failed (parse) for feature=${request.feature}, retrying: ${error instanceof Error ? error.message : String(error)}`);
                    continue;
                }
                throw error;
            }
        }
        if (!parsed) {
            throw lastError ?? new Error('Grounder failed after all retry attempts');
        }
        if (request.traceStep !== undefined) {
            let bounds = null;
            const idx = parsed.output['index'];
            if (typeof idx === 'number' && request.hierarchy) {
                const node = request.hierarchy.flattenedHierarchy[idx];
                bounds = node?.bounds ?? null;
            }
            common_1.Logger.i((0, trace_js_1.formatGrounderResult)({
                step: request.traceStep,
                output: parsed.output,
                bounds,
            }));
        }
        return {
            ...parsed,
            trace: {
                totalMs: promptBuildMs + llmMs + parseMs,
                promptBuildMs,
                llmMs,
                parseMs,
            },
            ...(lastLLMCall ? { llmCall: lastLLMCall } : {}),
        };
    }
    // ---------- private ----------
    /**
     * Call an LLM via Vercel AI SDK. Uses Output.json() so the provider emits
     * strict JSON (Google response_mime_type, OpenAI response_format, Anthropic
     * structuredOutputMode), matching the Kotlin backend's behavior.
     */
    async _callLLM(systemPrompt, userParts, feature) {
        const resolved = this._resolveFeatureConfig(feature);
        const model = this._getModel(resolved);
        const providerOptions = this._getProviderOptions(resolved, feature);
        const phase = phaseForFeature(feature);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userContent = userParts.map((part) => {
            if (part.type === 'image') {
                return { type: 'image', image: part.image };
            }
            return { type: 'text', text: part.text };
        });
        // Persist the exact messages we send so we can forward them verbatim to
        // observability backends (Langfuse stores these for debugging).
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
        ];
        const startedAt = new Date().toISOString();
        const startPerfMs = node_perf_hooks_1.performance.now();
        let output;
        let text = '';
        let reasoningText;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let usage;
        let thrownError;
        try {
            const result = await (0, ai_1.generateText)({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent },
                ],
                // Anthropic has no schema-less JSON mode — the @ai-sdk/anthropic
                // adapter drops responseFormat silently without a schema, letting
                // Claude free-write multiple candidate JSONs. Passing a schema routes
                // the call through Anthropic's tool-use API for enforced structured
                // output. OpenAI and Google keep their working schema-less paths.
                output: resolved.provider === 'anthropic'
                    ? ai_1.Output.object({ schema: (0, schemas_js_1.schemaForFeature)(feature) })
                    : ai_1.Output.json(),
                maxOutputTokens: phase === 'planner' ? 8192 : 4096,
                providerOptions,
            });
            output = result.output;
            text = result.text;
            reasoningText = result.reasoningText;
            usage = result.usage;
        }
        catch (error) {
            thrownError = error;
        }
        const completedAt = new Date().toISOString();
        const durationMs = (0, trace_js_1.roundDuration)(node_perf_hooks_1.performance.now() - startPerfMs);
        const llmCall = {
            provider: resolved.provider,
            model: resolved.modelName,
            feature: feature ?? phase,
            prompt: messages,
            completion: text,
            usage: normalizeUsage(usage),
            startedAt,
            completedAt,
            durationMs,
            ...(thrownError
                ? { statusMessage: thrownError instanceof Error ? thrownError.message : String(thrownError) }
                : {}),
        };
        if (thrownError) {
            throw ((0, providerFailure_js_1.classifyFatalProviderError)(thrownError, {
                provider: resolved.provider,
                modelName: resolved.modelName,
            }) ?? thrownError);
        }
        if (reasoningText) {
            common_1.Logger.d(`LLM reasoning [${feature}] (${resolved.provider}/${resolved.modelName}):\n${reasoningText}`);
        }
        common_1.Logger.d(`LLM response [${feature}] (${resolved.provider}/${resolved.modelName}):\n${text || '<empty response>'}`);
        return { output, text, llmCall };
    }
    /**
     * Resolve the effective provider / model / reasoning for a feature by
     * merging the optional per-feature override on top of workspace defaults.
     */
    _resolveFeatureConfig(feature) {
        const override = this._features[feature];
        let provider = this._defaults.provider;
        let modelName = this._defaults.modelName;
        if (override?.model) {
            // Reuse the shared parser so per-feature overrides fail with the same
            // validation errors (empty provider/model, unsupported provider) as
            // workspace-level `model:` and the `--model` CLI flag.
            const parsed = (0, common_1.parseModel)(override.model, `features.${feature}.model`);
            provider = parsed.provider;
            modelName = parsed.modelName;
        }
        const reasoning = override?.reasoning ?? this._defaults.reasoning ?? DEFAULT_REASONING_BY_PHASE[phaseForFeature(feature)];
        return { provider, modelName, reasoning };
    }
    /**
     * Create (or reuse a cached) Vercel AI SDK model instance for the
     * resolved provider/modelName.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _getModel(resolved) {
        const cacheKey = `${resolved.provider}/${resolved.modelName}`;
        const cached = this._clientCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const apiKey = this._apiKeys[resolved.provider];
        if (!apiKey) {
            throw new Error(`Missing API key for provider "${resolved.provider}". Set the corresponding env var (e.g. OPENAI_API_KEY, GOOGLE_API_KEY, ANTHROPIC_API_KEY).`);
        }
        let client;
        switch (resolved.provider) {
            case 'openai': {
                const openai = (0, openai_1.createOpenAI)({ apiKey });
                // Use the Responses API (not Chat Completions) so that
                // `providerOptions.openai.reasoningEffort` is honored by reasoning
                // models like gpt-5.4-mini. `openai(modelId)` defaults to Chat
                // Completions and silently ignores reasoning effort.
                client = openai.responses(resolved.modelName);
                break;
            }
            case 'google': {
                const google = (0, google_1.createGoogleGenerativeAI)({ apiKey });
                client = google(resolved.modelName);
                break;
            }
            case 'anthropic': {
                const anthropic = (0, anthropic_1.createAnthropic)({ apiKey });
                client = anthropic(resolved.modelName);
                break;
            }
            default:
                throw new Error(`Unsupported AI provider: ${resolved.provider}`);
        }
        this._clientCache.set(cacheKey, client);
        return client;
    }
    _getProviderOptions(resolved, feature) {
        const { provider, reasoning } = resolved;
        if (reasoning === 'minimal' && provider !== 'openai') {
            throw new Error(`Reasoning level "minimal" is only supported for OpenAI. Feature "${feature}" is configured for provider "${provider}".`);
        }
        switch (provider) {
            case 'google': {
                return {
                    google: {
                        thinkingConfig: {
                            thinkingLevel: reasoning,
                            includeThoughts: false,
                        },
                    },
                };
            }
            case 'openai':
                return {
                    openai: {
                        reasoningEffort: reasoning,
                    },
                };
            case 'anthropic':
                return {
                    anthropic: {
                        effort: reasoning,
                        // Force Anthropic's native structured-output API
                        // (`output_config.format`). The SDK's `auto` mode falls back to a
                        // `json` tool wrapper when its hardcoded model-capability table
                        // doesn't recognize the model — but that table lags behind new
                        // releases (e.g. Opus 4.7 isn't listed even though it supports
                        // structured output). Pinning `outputFormat` makes us forward-
                        // compatible with every Claude 4.5+ model without any
                        // model-version checks on our side.
                        structuredOutputMode: 'outputFormat',
                    },
                };
            default:
                return undefined;
        }
    }
    /**
     * Load a system prompt from the bundled .md files.
     */
    _loadPrompt(key) {
        if (this._promptCache.has(key)) {
            return this._promptCache.get(key);
        }
        const candidates = [
            process.env['USB_UI_TEST_PROMPTS_DIR']
                ? path.resolve(process.env['USB_UI_TEST_PROMPTS_DIR'], `${key}.md`)
                : undefined,
            path.resolve(__dirname, `../prompts/${key}.md`),
            path.resolve(__dirname, `../../src/prompts/${key}.md`),
            path.resolve(__dirname, `../../../src/prompts/${key}.md`),
        ].filter((candidate) => Boolean(candidate));
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                const content = fs.readFileSync(candidate, 'utf-8');
                this._promptCache.set(key, content);
                return content;
            }
        }
        throw new Error(`Prompt file not found for key "${key}". Searched: ${candidates.join(', ')}`);
    }
    /**
     * Map feature name to prompt file name.
     */
    _getPromptKeyForFeature(feature) {
        switch (feature) {
            case common_1.FEATURE_GROUNDER:
                return 'grounder';
            case common_1.FEATURE_VISUAL_GROUNDER:
                return 'visual-grounder';
            case common_1.FEATURE_SCROLL_INDEX_GROUNDER:
                return 'scroll-grounder';
            case common_1.FEATURE_INPUT_FOCUS_GROUNDER:
                return 'input-focus-grounder';
            case common_1.FEATURE_LAUNCH_APP_GROUNDER:
                return 'launch-app-grounder';
            case common_1.FEATURE_SET_LOCATION_GROUNDER:
                return 'set-location-grounder';
            case common_1.FEATURE_PLANNER:
                return 'planner';
            default:
                return 'grounder';
        }
    }
    /**
     * Parse the planner LLM response into PlannerResponse. The SDK has already
     * parsed the JSON via Output.json(), so we just normalize the shape.
     */
    _parsePlannerResponse(output, rawText) {
        const record = asRecord(output);
        if (!record) {
            throw new Error(`Planner response is not a JSON object: ${rawText.substring(0, 200)}`);
        }
        const normalized = normalizePlannerResponse(record);
        if (!normalized.act) {
            throw new Error(`Planner response missing actionable action_type: ${rawText.substring(0, 300)}`);
        }
        return normalized;
    }
    /**
     * Parse the grounder LLM response into GrounderResponse. The SDK has already
     * parsed the JSON via Output.json(), so we just unwrap the `output` key when
     * present.
     */
    _parseGrounderResponse(output, rawText) {
        const record = asRecord(output);
        if (!record) {
            throw new Error(`Grounder response is not a JSON object: ${rawText.substring(0, 200)}`);
        }
        const grounderOutput = asRecord(record['output']) ?? record;
        return { output: grounderOutput, raw: rawText };
    }
    // ---------- Input visibility logging ----------
    _summarizePlannerRequest(req) {
        const parts = ['[AI plan]'];
        parts.push(this._formatLogContext(req.logContext, req.traceStep));
        const plannerResolved = this._resolveFeatureConfig(common_1.FEATURE_PLANNER);
        parts.push(`provider=${plannerResolved.provider}/${plannerResolved.modelName}`);
        parts.push(this._screenshotMetric('screenshot', req.preActionScreenshot));
        if (req.postActionScreenshot) {
            parts.push(this._screenshotMetric('postScreenshot', req.postActionScreenshot));
        }
        const hierarchyCount = req.hierarchy
            ? req.hierarchy.toPromptElementsForPlanner(req.platform).length
            : 0;
        parts.push(`hierarchy=${hierarchyCount}`);
        parts.push(`history=${this._countHistoryLines(req.history)}`);
        parts.push(`remember=${req.remember?.length ?? 0}`);
        parts.push(`preContext=${req.preContext ? 'yes' : 'no'}`);
        parts.push(`appKnowledge=${req.appKnowledge ? 'yes' : 'no'}`);
        parts.push(`goal=${req.testObjective.length}ch`);
        return parts.join(' ');
    }
    _summarizeGrounderRequest(req) {
        const parts = ['[AI ground]'];
        parts.push(this._formatLogContext(req.logContext, req.traceStep));
        const grounderResolved = this._resolveFeatureConfig(req.feature);
        parts.push(`provider=${grounderResolved.provider}/${grounderResolved.modelName}`);
        parts.push(`feature=${req.feature}`);
        parts.push(this._screenshotMetric('screenshot', req.screenshot));
        const hierarchyCount = req.hierarchy
            ? req.hierarchy.toPromptElementsForGrounder(req.platform).length
            : 0;
        parts.push(`hierarchy=${hierarchyCount}`);
        const actSnippet = req.act.length > 80 ? `${req.act.slice(0, 80)}…` : req.act;
        parts.push(`act="${actSnippet}"`);
        return parts.join(' ');
    }
    _detailPlannerRequest(req, prompt) {
        const payload = {
            logContext: req.logContext,
            platform: req.platform,
            goal: req.testObjective,
            screenshot: req.preActionScreenshot
                ? `<base64 ${req.preActionScreenshot.length} chars>`
                : null,
            postScreenshot: req.postActionScreenshot
                ? `<base64 ${req.postActionScreenshot.length} chars>`
                : null,
            hierarchy: req.hierarchy
                ? {
                    count: req.hierarchy.toPromptElementsForPlanner(req.platform).length,
                    firstFew: req.hierarchy
                        .toPromptElementsForPlanner(req.platform)
                        .slice(0, 3),
                }
                : null,
            history: req.history ? req.history.split('\n').filter(Boolean) : [],
            remember: req.remember ?? [],
            preContext: req.preContext ?? null,
            appKnowledge: req.appKnowledge ?? null,
            promptLength: prompt.length,
        };
        return `[AI plan detail] ${this._formatLogContext(req.logContext, req.traceStep)} ${JSON.stringify(payload, null, 2)}`;
    }
    _detailGrounderRequest(req, prompt) {
        const payload = {
            logContext: req.logContext,
            feature: req.feature,
            platform: req.platform,
            act: req.act,
            screenshot: req.screenshot
                ? `<base64 ${req.screenshot.length} chars>`
                : null,
            hierarchy: req.hierarchy
                ? {
                    count: req.hierarchy.toPromptElementsForGrounder(req.platform).length,
                    firstFew: req.hierarchy
                        .toPromptElementsForGrounder(req.platform)
                        .slice(0, 3),
                }
                : null,
            availableApps: req.availableApps ?? null,
            promptLength: prompt.length,
        };
        return `[AI ground detail] ${this._formatLogContext(req.logContext, req.traceStep)} ${JSON.stringify(payload, null, 2)}`;
    }
    _formatLogContext(logContext, traceStep) {
        const ctx = logContext && logContext.length > 0 ? logContext : 'no-ctx';
        return traceStep !== undefined ? `ctx=${ctx} iter=${traceStep}` : `ctx=${ctx}`;
    }
    _screenshotMetric(label, base64) {
        if (!base64 || base64.length === 0)
            return `${label}=no`;
        // base64 → bytes: length * 3/4, rounded.
        const bytes = Math.round((base64.length * 3) / 4);
        const kb = Math.max(1, Math.round(bytes / 1024));
        return `${label}=${kb}KB`;
    }
    _countHistoryLines(history) {
        if (!history)
            return 0;
        return history.split('\n').filter((line) => line.trim().length > 0).length;
    }
}
exports.AIAgent = AIAgent;
function normalizePlannerResponse(json) {
    const output = asRecord(json['output']) ?? json;
    const thought = asRecord(output['thought']);
    const action = asRecord(output['action']) ??
        asRecord(json['action']) ??
        (normalizeString(output['action_type']) ? output : undefined) ??
        (normalizeString(json['action_type']) ? json : undefined);
    if (!action) {
        if (typeof json['act'] === 'string') {
            return {
                act: json['act'],
                reason: normalizeString(json['reason']) ?? '',
                remember: normalizeRemember(json['remember']),
            };
        }
        return {
            act: '',
            reason: '',
            remember: normalizeRemember(output['remember']),
        };
    }
    const normalizedAction = normalizePromptAction(normalizeString(action['action_type']) ?? '', action);
    const thoughtAct = normalizeString(thought?.['act']);
    const isTerminalAction = normalizedAction.act === common_1.PLANNER_ACTION_COMPLETED ||
        normalizedAction.act === common_1.PLANNER_ACTION_FAILED;
    return {
        act: normalizedAction.act,
        reason: isTerminalAction
            ? normalizedAction.reason
            : firstNonEmpty(thoughtAct, normalizedAction.reason) ?? '',
        remember: normalizeRemember(output['remember']),
        text: normalizeString(action['text']),
        clearText: normalizeBoolean(action['clear_text']),
        direction: normalizeString(action['direction']),
        durationSeconds: normalizeNumber(action['duration']),
        url: normalizeString(action['url']),
        result: normalizeString(action['result']),
        analysis: normalizeString(action['analysis']),
        severity: normalizeString(action['severity']),
        repeat: normalizeNumber(action['repeat']),
        delayBetweenTapMs: normalizeNumber(action['delay_between_tap'] ?? action['delayBetweenTap']),
        thought: thought
            ? {
                plan: normalizeString(thought['plan']),
                think: normalizeString(thought['think']),
                act: thoughtAct,
            }
            : undefined,
    };
}
function normalizePromptAction(actionType, action) {
    switch (actionType) {
        case 'tap':
            return { act: common_1.PLANNER_ACTION_TAP, reason: 'Tap the target element.' };
        case 'long_press':
            return { act: common_1.PLANNER_ACTION_LONG_PRESS, reason: 'Long press the target element.' };
        case 'input_text':
            return { act: common_1.PLANNER_ACTION_TYPE, reason: 'Type text into the target input field.' };
        case 'swipe':
            return {
                act: common_1.PLANNER_ACTION_SCROLL,
                reason: firstNonEmpty(normalizeString(action['act']), normalizeString(action['direction']) ? `Swipe ${normalizeString(action['direction'])}` : undefined, 'Scroll the current view.') ?? 'Scroll the current view.',
            };
        case 'navigate_home':
            return { act: common_1.PLANNER_ACTION_HOME, reason: 'Navigate to the device home screen.' };
        case 'rotate':
            return { act: common_1.PLANNER_ACTION_ROTATE, reason: 'Rotate the device orientation.' };
        case 'navigate_back':
            return { act: common_1.PLANNER_ACTION_BACK, reason: 'Navigate back one screen.' };
        case 'hide_keyboard':
            return { act: common_1.PLANNER_ACTION_HIDE_KEYBOARD, reason: 'Hide the software keyboard.' };
        case 'keyboard_enter':
            return { act: common_1.PLANNER_ACTION_PRESS_ENTER, reason: 'Press the enter key.' };
        case 'wait':
            return { act: common_1.PLANNER_ACTION_WAIT, reason: 'Wait for the UI to stabilize.' };
        case 'deep_link':
            return { act: common_1.PLANNER_ACTION_DEEPLINK, reason: 'Open the deeplink URL.' };
        case 'set_location':
            return { act: common_1.PLANNER_ACTION_SET_LOCATION, reason: 'Set the device location.' };
        case 'launch_app':
            return { act: common_1.PLANNER_ACTION_LAUNCH_APP, reason: 'Launch the target app.' };
        case 'status': {
            const result = normalizeString(action['result'])?.toLowerCase();
            return {
                act: result === 'success' ? common_1.PLANNER_ACTION_COMPLETED : common_1.PLANNER_ACTION_FAILED,
                reason: firstNonEmpty(normalizeString(action['analysis']), normalizeString(action['result']), 'Planner returned final status.') ?? 'Planner returned final status.',
            };
        }
        default:
            return {
                act: actionType,
                reason: `Planner returned unsupported action_type: ${actionType}`,
            };
    }
}
function asRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
function normalizeRemember(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((item) => {
        if (typeof item === 'string') {
            return item.trim();
        }
        try {
            return JSON.stringify(item);
        }
        catch {
            return String(item);
        }
    })
        .filter((item) => item.length > 0);
}
function normalizeString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function normalizeNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    return undefined;
}
function normalizeBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    return undefined;
}
function firstNonEmpty(...values) {
    return values.find((value) => typeof value === 'string' && value.trim().length > 0);
}
/**
 * Convert the Vercel AI SDK's `LanguageModelUsage` (inputTokens/outputTokens
 * with nested *TokenDetails) into the Langfuse canonical shape
 * (input/output/total, optional input_cached_tokens only if > 0).
 * Fields default to 0 when the provider omits them.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUsage(usage) {
    const input = typeof usage?.inputTokens === 'number'
        ? usage.inputTokens
        : typeof usage?.promptTokens === 'number'
            ? usage.promptTokens
            : 0;
    const output = typeof usage?.outputTokens === 'number'
        ? usage.outputTokens
        : typeof usage?.completionTokens === 'number'
            ? usage.completionTokens
            : 0;
    const total = typeof usage?.totalTokens === 'number'
        ? usage.totalTokens
        : input + output;
    const cacheRead = typeof usage?.inputTokenDetails?.cacheReadTokens === 'number'
        ? usage.inputTokenDetails.cacheReadTokens
        : undefined;
    return cacheRead !== undefined && cacheRead > 0
        ? { input, output, total, input_cached_tokens: cacheRead }
        : { input, output, total };
}
//# sourceMappingURL=AIAgent.js.map