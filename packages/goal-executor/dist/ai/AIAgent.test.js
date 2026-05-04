"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const AIAgent_js_1 = require("./AIAgent.js");
const providerFailure_js_1 = require("./providerFailure.js");
function makeAgent(overrides) {
    const defaults = {
        provider: overrides?.defaults?.provider ?? 'google',
        modelName: overrides?.defaults?.modelName ?? 'gemini-test',
        ...(overrides?.defaults?.reasoning !== undefined
            ? { reasoning: overrides.defaults.reasoning }
            : {}),
    };
    return new AIAgent_js_1.AIAgent({
        apiKeys: overrides?.apiKeys ?? {
            google: 'test-key',
            openai: 'test-key',
            anthropic: 'test-key',
        },
        defaults,
        ...(overrides?.features !== undefined ? { features: overrides.features } : {}),
    });
}
function parsePlannerResponse(output, rawText = '') {
    const agent = makeAgent();
    return agent._parsePlannerResponse(output, rawText);
}
function parseGrounderResponse(output, rawText = '') {
    const agent = makeAgent();
    return agent._parseGrounderResponse(output, rawText);
}
function getProviderOptions(params) {
    const agent = makeAgent({
        defaults: {
            provider: params.provider,
            modelName: params.modelName,
            ...(params.defaultReasoning !== undefined ? { reasoning: params.defaultReasoning } : {}),
        },
        ...(params.features !== undefined ? { features: params.features } : {}),
    });
    const resolved = agent._resolveFeatureConfig(params.feature);
    return agent._getProviderOptions(resolved, params.feature);
}
(0, node_test_1.default)('AIAgent uses medium Google reasoning defaults for planner feature', () => {
    const providerOptions = getProviderOptions({
        provider: 'google',
        modelName: 'gemini-3.1-pro-preview',
        feature: common_1.FEATURE_PLANNER,
    });
    strict_1.default.deepEqual(providerOptions, {
        google: {
            thinkingConfig: {
                thinkingLevel: 'medium',
                includeThoughts: false,
            },
        },
    });
});
(0, node_test_1.default)('AIAgent uses low Google reasoning defaults for grounder feature', () => {
    const providerOptions = getProviderOptions({
        provider: 'google',
        modelName: 'gemini-3.1-pro-preview',
        feature: common_1.FEATURE_GROUNDER,
    });
    strict_1.default.deepEqual(providerOptions, {
        google: {
            thinkingConfig: {
                thinkingLevel: 'low',
                includeThoughts: false,
            },
        },
    });
});
(0, node_test_1.default)('AIAgent applies Google reasoning defaults without model-family gating', () => {
    const providerOptions = getProviderOptions({
        provider: 'google',
        modelName: 'gemini-2.0-flash',
        feature: common_1.FEATURE_PLANNER,
    });
    strict_1.default.deepEqual(providerOptions, {
        google: {
            thinkingConfig: {
                thinkingLevel: 'medium',
                includeThoughts: false,
            },
        },
    });
});
(0, node_test_1.default)('AIAgent uses medium OpenAI reasoning defaults for planner feature', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5',
        feature: common_1.FEATURE_PLANNER,
    });
    strict_1.default.deepEqual(providerOptions, {
        openai: {
            reasoningEffort: 'medium',
        },
    });
});
(0, node_test_1.default)('AIAgent uses low OpenAI reasoning defaults for grounder feature', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5',
        feature: common_1.FEATURE_GROUNDER,
    });
    strict_1.default.deepEqual(providerOptions, {
        openai: {
            reasoningEffort: 'low',
        },
    });
});
(0, node_test_1.default)('AIAgent applies OpenAI reasoning defaults without model-family gating', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5.4-mini',
        feature: common_1.FEATURE_PLANNER,
    });
    strict_1.default.deepEqual(providerOptions, {
        openai: {
            reasoningEffort: 'medium',
        },
    });
});
(0, node_test_1.default)('AIAgent uses medium Anthropic effort defaults for planner feature', () => {
    const providerOptions = getProviderOptions({
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-6',
        feature: common_1.FEATURE_PLANNER,
    });
    strict_1.default.deepEqual(providerOptions, {
        anthropic: {
            effort: 'medium',
            structuredOutputMode: 'outputFormat',
        },
    });
});
(0, node_test_1.default)('AIAgent uses low Anthropic effort defaults for grounder feature', () => {
    const providerOptions = getProviderOptions({
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-6',
        feature: common_1.FEATURE_GROUNDER,
    });
    strict_1.default.deepEqual(providerOptions, {
        anthropic: {
            effort: 'low',
            structuredOutputMode: 'outputFormat',
        },
    });
});
(0, node_test_1.default)('AIAgent applies Anthropic effort defaults without model-family gating', () => {
    const providerOptions = getProviderOptions({
        provider: 'anthropic',
        modelName: 'claude-3-7-sonnet-latest',
        feature: common_1.FEATURE_PLANNER,
    });
    strict_1.default.deepEqual(providerOptions, {
        anthropic: {
            effort: 'medium',
            structuredOutputMode: 'outputFormat',
        },
    });
});
(0, node_test_1.default)('AIAgent respects workspace-wide reasoning default across features', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5.4-mini',
        feature: common_1.FEATURE_GROUNDER,
        defaultReasoning: 'high',
    });
    strict_1.default.deepEqual(providerOptions, {
        openai: {
            reasoningEffort: 'high',
        },
    });
});
(0, node_test_1.default)('AIAgent per-feature reasoning override beats workspace default', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5.4-mini',
        feature: common_1.FEATURE_PLANNER,
        defaultReasoning: 'low',
        features: { planner: { reasoning: 'high' } },
    });
    strict_1.default.deepEqual(providerOptions, {
        openai: {
            reasoningEffort: 'high',
        },
    });
});
(0, node_test_1.default)('AIAgent per-feature model override re-routes to the named provider', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5.4-mini',
        feature: common_1.FEATURE_SCROLL_INDEX_GROUNDER,
        features: {
            'scroll-index-grounder': {
                model: 'google/gemini-2.0-flash',
                reasoning: 'medium',
            },
        },
    });
    strict_1.default.deepEqual(providerOptions, {
        google: {
            thinkingConfig: {
                thinkingLevel: 'medium',
                includeThoughts: false,
            },
        },
    });
});
(0, node_test_1.default)('AIAgent rejects minimal reasoning on non-OpenAI provider', () => {
    strict_1.default.throws(() => getProviderOptions({
        provider: 'google',
        modelName: 'gemini-3.1-pro-preview',
        feature: common_1.FEATURE_GROUNDER,
        defaultReasoning: 'minimal',
    }), /Reasoning level "minimal" is only supported for OpenAI/);
});
(0, node_test_1.default)('AIAgent accepts minimal reasoning on OpenAI', () => {
    const providerOptions = getProviderOptions({
        provider: 'openai',
        modelName: 'gpt-5.4-mini',
        feature: common_1.FEATURE_GROUNDER,
        defaultReasoning: 'minimal',
    });
    strict_1.default.deepEqual(providerOptions, {
        openai: {
            reasoningEffort: 'minimal',
        },
    });
});
(0, node_test_1.default)('AIAgent normalizes rotate planner actions', () => {
    const response = parsePlannerResponse({
        output: {
            action: { action_type: 'rotate' },
            remember: [],
        },
    });
    strict_1.default.equal(response.act, common_1.PLANNER_ACTION_ROTATE);
    strict_1.default.equal(response.reason, 'Rotate the device orientation.');
});
(0, node_test_1.default)('AIAgent normalizes nested planner output from planner prompt schema', () => {
    const response = parsePlannerResponse({
        output: {
            thought: {
                plan: '[-> Type Hindi]',
                think: 'The language picker is focused and ready.',
                act: 'Type "Hindi" into the search field.',
            },
            action: {
                action_type: 'input_text',
                text: 'Hindi',
                clear_text: true,
            },
            remember: ['At step 2, Hindi search has started.'],
        },
    });
    strict_1.default.equal(response.act, 'type');
    strict_1.default.equal(response.reason, 'Type "Hindi" into the search field.');
    strict_1.default.equal(response.text, 'Hindi');
    strict_1.default.equal(response.clearText, true);
    strict_1.default.deepEqual(response.remember, ['At step 2, Hindi search has started.']);
    strict_1.default.equal(response.thought?.plan, '[-> Type Hindi]');
});
(0, node_test_1.default)('AIAgent maps terminal status responses to completed and keeps analysis as the message', () => {
    const response = parsePlannerResponse({
        output: {
            thought: {
                plan: '[✓ Verify language added]',
                think: 'Hindi is visible in the added languages list.',
                act: 'This should not override the final analysis.',
            },
            action: {
                action_type: 'status',
                result: 'Success',
                analysis: 'Hindi is visible in the selected languages list.',
            },
            remember: [],
        },
    });
    strict_1.default.equal(response.act, 'completed');
    strict_1.default.equal(response.reason, 'Hindi is visible in the selected languages list.');
    strict_1.default.equal(response.result, 'Success');
    strict_1.default.equal(response.analysis, 'Hindi is visible in the selected languages list.');
    strict_1.default.deepEqual(response.remember, []);
});
(0, node_test_1.default)('AIAgent accepts unwrapped planner output without the output key', () => {
    const response = parsePlannerResponse({
        thought: { plan: '[-> Tap]', think: 'Target visible.', act: 'Tap button' },
        action: { action_type: 'tap' },
        remember: [],
    });
    strict_1.default.equal(response.act, 'tap');
    strict_1.default.equal(response.reason, 'Tap button');
});
(0, node_test_1.default)('AIAgent parses standard grounder output', () => {
    const response = parseGrounderResponse({
        output: { index: 42, reason: 'Exact text match.' },
    });
    strict_1.default.deepEqual(response.output, {
        index: 42,
        reason: 'Exact text match.',
    });
});
(0, node_test_1.default)('AIAgent parses scroll grounder output with snake_case coordinates', () => {
    const response = parseGrounderResponse({
        output: {
            start_x: 540,
            start_y: 1800,
            end_x: 540,
            end_y: 400,
            durationMs: 600,
            reason: 'Computed swipe up vector.',
        },
    });
    strict_1.default.deepEqual(response.output, {
        start_x: 540,
        start_y: 1800,
        end_x: 540,
        end_y: 400,
        durationMs: 600,
        reason: 'Computed swipe up vector.',
    });
});
(0, node_test_1.default)('AIAgent parses launch-app grounder output', () => {
    const response = parseGrounderResponse({
        output: {
            packageName: 'com.whatsapp',
            allowAllPermissions: false,
            reason: 'Matched by exact app name.',
        },
    });
    strict_1.default.deepEqual(response.output, {
        packageName: 'com.whatsapp',
        allowAllPermissions: false,
        reason: 'Matched by exact app name.',
    });
});
(0, node_test_1.default)('AIAgent parses set-location grounder output', () => {
    const response = parseGrounderResponse({
        output: {
            lat: '37.7749',
            long: '-122.4194',
            reason: 'Resolved San Francisco to city center coordinates.',
        },
    });
    strict_1.default.deepEqual(response.output, {
        lat: '37.7749',
        long: '-122.4194',
        reason: 'Resolved San Francisco to city center coordinates.',
    });
});
(0, node_test_1.default)('AIAgent parses grounder output without the output wrapper', () => {
    const response = parseGrounderResponse({
        index: 7,
        reason: 'Direct match.',
    });
    strict_1.default.deepEqual(response.output, {
        index: 7,
        reason: 'Direct match.',
    });
});
(0, node_test_1.default)('AIAgent rejects planner responses that are not JSON objects', () => {
    strict_1.default.throws(() => parsePlannerResponse('not an object', 'not an object'), /Planner response is not a JSON object/);
});
(0, node_test_1.default)('AIAgent rejects planner responses missing an actionable action_type', () => {
    strict_1.default.throws(() => parsePlannerResponse({ output: { thought: { plan: '[]' }, remember: [] } }, ''), /missing actionable action_type/);
});
(0, node_test_1.default)('AIAgent rejects grounder responses that are not JSON objects', () => {
    strict_1.default.throws(() => parseGrounderResponse(null, ''), /Grounder response is not a JSON object/);
});
function installMockCallLLM(agent, results) {
    let idx = 0;
    agent._callLLM = async () => {
        const next = results[idx++];
        if (next instanceof Error) {
            throw next;
        }
        if (!next) {
            throw new Error(`No more mock results (called ${idx} times)`);
        }
        return next;
    };
    return { callCount: () => idx };
}
const validPlannerOutput = {
    output: {
        thought: { plan: '[-> Tap]', think: 'Target visible.', act: 'Tap button' },
        action: { action_type: 'tap' },
        remember: [],
    },
};
const emptyPlannerOutput = { output: {} };
(0, node_test_1.default)('AIAgent.plan retries on parse failure then succeeds', async () => {
    const agent = makeAgent();
    const mock = installMockCallLLM(agent, [
        { output: emptyPlannerOutput, text: '' },
        { output: validPlannerOutput, text: '' },
    ]);
    const response = await agent.plan({
        testObjective: 'test',
        platform: 'android',
    });
    strict_1.default.equal(response.act, common_1.PLANNER_ACTION_TAP);
    strict_1.default.equal(mock.callCount(), 2);
});
(0, node_test_1.default)('AIAgent.plan retries on transient LLM error then succeeds', async () => {
    const agent = makeAgent();
    const mock = installMockCallLLM(agent, [
        new Error('ECONNRESET'),
        { output: validPlannerOutput, text: '' },
    ]);
    const response = await agent.plan({
        testObjective: 'test',
        platform: 'android',
    });
    strict_1.default.equal(response.act, common_1.PLANNER_ACTION_TAP);
    strict_1.default.equal(mock.callCount(), 2);
});
(0, node_test_1.default)('AIAgent.plan does NOT retry on FatalProviderError', async () => {
    const agent = makeAgent();
    const mock = installMockCallLLM(agent, [
        new providerFailure_js_1.FatalProviderError({
            provider: 'google',
            modelName: 'gemini-test',
            statusCode: 401,
            detail: 'Unauthorized',
        }),
        { output: validPlannerOutput, text: '' },
    ]);
    await strict_1.default.rejects(() => agent.plan({ testObjective: 'test', platform: 'android' }), (error) => providerFailure_js_1.FatalProviderError.isInstance(error));
    strict_1.default.equal(mock.callCount(), 1);
});
(0, node_test_1.default)('AIAgent.plan surfaces the last parse error after exhausting retries', async () => {
    const agent = makeAgent();
    const mock = installMockCallLLM(agent, [
        { output: emptyPlannerOutput, text: '' },
        { output: emptyPlannerOutput, text: '' },
    ]);
    await strict_1.default.rejects(() => agent.plan({ testObjective: 'test', platform: 'android' }), /missing actionable action_type/);
    strict_1.default.equal(mock.callCount(), 2);
});
(0, node_test_1.default)('AIAgent.ground retries on parse failure then succeeds', async () => {
    const agent = makeAgent();
    const mock = installMockCallLLM(agent, [
        { output: null, text: '' },
        { output: { index: 5, reason: 'match' }, text: '' },
    ]);
    const response = await agent.ground({
        feature: common_1.FEATURE_GROUNDER,
        act: 'Tap button',
    });
    strict_1.default.equal(response.output['index'], 5);
    strict_1.default.equal(mock.callCount(), 2);
});
(0, node_test_1.default)('AIAgent.ground does NOT retry on FatalProviderError', async () => {
    const agent = makeAgent();
    const mock = installMockCallLLM(agent, [
        new providerFailure_js_1.FatalProviderError({
            provider: 'google',
            modelName: 'gemini-test',
            statusCode: 400,
            detail: 'Bad request',
        }),
        { output: { index: 5 }, text: '' },
    ]);
    await strict_1.default.rejects(() => agent.ground({ feature: common_1.FEATURE_GROUNDER, act: 'Tap button' }), (error) => providerFailure_js_1.FatalProviderError.isInstance(error));
    strict_1.default.equal(mock.callCount(), 1);
});
//# sourceMappingURL=AIAgent.test.js.map