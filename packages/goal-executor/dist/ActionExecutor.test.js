"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const providerFailure_js_1 = require("./ai/providerFailure.js");
const ActionExecutor_js_1 = require("./ActionExecutor.js");
function createAgent(executedActions, options) {
    return {
        async setUp() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async executeAction(request) {
            if (request.action instanceof common_1.GetAppListAction) {
                return new common_1.DeviceNodeResponse({
                    success: true,
                    data: {
                        apps: options?.availableApps ?? [],
                    },
                });
            }
            executedActions.push(request.action);
            return new common_1.DeviceNodeResponse({ success: true });
        },
        isConnected() {
            return true;
        },
        getDeviceInfo() {
            return {
                id: 'emulator-5554',
                deviceUUID: 'device-1',
                isAndroid: true,
                sdkVersion: 34,
                getPlatform() {
                    return 'android';
                },
            };
        },
        async closeConnection() {
            return undefined;
        },
        killDriver() {
            return undefined;
        },
        setApiKey() {
            return undefined;
        },
        getId() {
            return 'device-1';
        },
        listenForDeviceDisconnection() {
            return undefined;
        },
        clearListener() {
            return undefined;
        },
        uninstallDriver() {
            return undefined;
        },
    };
}
function createAiAgent(groundImpl) {
    return {
        async ground(request) {
            return groundImpl(request);
        },
    };
}
function assertTraceNames(trace, expectedNames) {
    strict_1.default.deepEqual(trace?.spans.map((span) => span.name), expectedNames);
}
(0, node_test_1.default)('ActionExecutor repeats tap actions using the planner repeat fields', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async (request) => {
        strict_1.default.equal(request.feature, common_1.FEATURE_GROUNDER);
        return {
            output: { x: 100, y: 200 },
            raw: '{}',
            trace: {
                totalMs: 18,
                promptBuildMs: 3,
                llmMs: 11,
                parseMs: 4,
            },
        };
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TAP,
        reason: 'Tap the Add language button.',
        repeat: 3,
        delayBetweenTapMs: 0,
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 3);
    strict_1.default.ok(executedActions.every((action) => action instanceof common_1.TapAction));
    assertTraceNames(result.trace, ['action.ground', 'action.device']);
    strict_1.default.equal(result.trace?.spans[0]?.status, 'success');
});
(0, node_test_1.default)('ActionExecutor uses structured input text fields instead of extracting from reason', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async (request) => {
        strict_1.default.equal(request.feature, common_1.FEATURE_INPUT_FOCUS_GROUNDER);
        return {
            output: { index: null },
            raw: '{}',
            trace: {
                totalMs: 15,
                promptBuildMs: 2,
                llmMs: 9,
                parseMs: 4,
            },
        };
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TYPE,
        reason: 'Type into the language search field.',
        text: 'Hindi',
        clearText: false,
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.ok(executedActions[0] instanceof common_1.EnterTextAction);
    strict_1.default.equal(executedActions[0].value, 'Hindi');
    strict_1.default.equal(executedActions[0].shouldEraseText, false);
    assertTraceNames(result.trace, ['action.prep', 'action.ground', 'action.device']);
});
(0, node_test_1.default)('ActionExecutor uses structured deeplink URLs from the planner action payload', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => {
        throw new Error('Grounder should not be called for deeplink actions');
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_DEEPLINK,
        reason: 'Open the settings page.',
        url: 'wikipedia://settings/languages',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.ok(executedActions[0] instanceof common_1.DeeplinkAction);
    strict_1.default.equal(executedActions[0].deeplink, 'wikipedia://settings/languages');
    assertTraceNames(result.trace, ['action.prep', 'action.device']);
});
(0, node_test_1.default)('ActionExecutor traces launchApp with prep, ground, and device spans', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions, {
        availableApps: [
            { packageName: 'org.wikimedia.wikipedia', name: 'Wikipedia' },
            { packageName: 'com.apple.settings', name: 'Settings' },
        ],
    });
    const aiAgent = createAiAgent(async (request) => {
        strict_1.default.equal(request.feature, common_1.FEATURE_LAUNCH_APP_GROUNDER);
        strict_1.default.equal(request.availableApps?.length, 2);
        return {
            output: { packageName: 'org.wikimedia.wikipedia' },
            raw: '{}',
            trace: {
                totalMs: 21,
                promptBuildMs: 4,
                llmMs: 12,
                parseMs: 5,
            },
        };
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_LAUNCH_APP,
        reason: 'Launch Wikipedia.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.ok(executedActions[0] instanceof common_1.LaunchAppAction);
    strict_1.default.equal(executedActions[0].appUpload.packageName, 'org.wikimedia.wikipedia');
    assertTraceNames(result.trace, ['action.prep', 'action.ground', 'action.device']);
});
(0, node_test_1.default)('ActionExecutor does not default primary app relaunches to reinstall', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions, {
        availableApps: [
            { packageName: 'org.wikimedia.wikipedia', name: 'Wikipedia' },
        ],
    });
    const aiAgent = createAiAgent(async () => ({
        output: { packageName: 'org.wikimedia.wikipedia' },
        raw: '{}',
    }));
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
        appIdentifier: 'org.wikimedia.wikipedia',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_LAUNCH_APP,
        reason: 'Reopen Wikipedia.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.equal(executedActions[0].shouldUninstallBeforeLaunch, false);
});
(0, node_test_1.default)('ActionExecutor ignores malformed grounder boolean flags and preserves defaults', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions, {
        availableApps: [
            { packageName: 'org.wikimedia.wikipedia', name: 'Wikipedia' },
        ],
    });
    const aiAgent = createAiAgent(async () => ({
        output: {
            packageName: 'org.wikimedia.wikipedia',
            allowAllPermissions: 'false',
            shouldUninstallBeforeLaunch: 'false',
            clearState: 'true',
            stopAppBeforeLaunch: 1,
        },
        raw: '{}',
    }));
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
        appIdentifier: 'org.wikimedia.wikipedia',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_LAUNCH_APP,
        reason: 'Reopen Wikipedia.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    const action = executedActions[0];
    strict_1.default.equal(action.allowAllPermissions, true);
    strict_1.default.equal(action.shouldUninstallBeforeLaunch, false);
    strict_1.default.equal(action.clearState, false);
    strict_1.default.equal(action.stopAppBeforeLaunch, false);
});
(0, node_test_1.default)('ActionExecutor honors explicit grounder boolean flags for app launches', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions, {
        availableApps: [
            { packageName: 'org.wikimedia.wikipedia', name: 'Wikipedia' },
        ],
    });
    const aiAgent = createAiAgent(async () => ({
        output: {
            packageName: 'org.wikimedia.wikipedia',
            allowAllPermissions: false,
            shouldUninstallBeforeLaunch: true,
            clearState: true,
            stopAppBeforeLaunch: true,
        },
        raw: '{}',
    }));
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
        appIdentifier: 'org.wikimedia.wikipedia',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_LAUNCH_APP,
        reason: 'Reinstall and relaunch Wikipedia.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    const action = executedActions[0];
    strict_1.default.equal(action.allowAllPermissions, false);
    strict_1.default.equal(action.shouldUninstallBeforeLaunch, true);
    strict_1.default.equal(action.clearState, true);
    strict_1.default.equal(action.stopAppBeforeLaunch, true);
});
(0, node_test_1.default)('ActionExecutor traces wait actions without calling the device', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => {
        throw new Error('Grounder should not be called for wait actions');
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_WAIT,
        reason: 'Wait for the animation to finish.',
        durationSeconds: 0,
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 0);
    assertTraceNames(result.trace, ['action.wait']);
});
(0, node_test_1.default)('ActionExecutor executes rotate without calling the grounder', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => {
        throw new Error('Grounder should not be called for rotate actions');
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_ROTATE,
        reason: 'Rotate the device.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.ok(executedActions[0] instanceof common_1.RotateAction);
    assertTraceNames(result.trace, ['action.device']);
});
(0, node_test_1.default)('ActionExecutor records visual fallback explicitly in the trace', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    let groundCalls = 0;
    const aiAgent = createAiAgent(async (request) => {
        groundCalls += 1;
        if (request.tracePhase === 'action.visual_fallback') {
            strict_1.default.equal(request.feature, common_1.FEATURE_VISUAL_GROUNDER);
            return {
                output: { x: 42, y: 84, reason: 'Found visually' },
                raw: '{}',
                trace: {
                    totalMs: 19,
                    promptBuildMs: 3,
                    llmMs: 12,
                    parseMs: 4,
                },
            };
        }
        strict_1.default.equal(request.feature, common_1.FEATURE_GROUNDER);
        return {
            output: { needsVisualGrounding: true },
            raw: '{}',
            trace: {
                totalMs: 13,
                promptBuildMs: 2,
                llmMs: 8,
                parseMs: 3,
            },
        };
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TAP,
        reason: 'Tap the element that is only visible in the screenshot.',
        screenshot: 'base64-image',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(groundCalls, 2);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.ok(executedActions[0] instanceof common_1.TapAction);
    assertTraceNames(result.trace, ['action.ground', 'action.visual_fallback', 'action.device']);
});
(0, node_test_1.default)('ActionExecutor preserves a ground failure when no visual fallback is available', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => ({
        output: { isError: true, reason: 'Target element not found' },
        raw: '{}',
        trace: {
            totalMs: 12,
            promptBuildMs: 2,
            llmMs: 7,
            parseMs: 3,
        },
    }));
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TAP,
        reason: 'Tap the missing button.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(result.error, 'Target element not found');
    strict_1.default.equal(executedActions.length, 0);
    assertTraceNames(result.trace, ['action.ground']);
    strict_1.default.equal(result.trace?.spans[0]?.status, 'failure');
});
(0, node_test_1.default)('ActionExecutor surfaces terminal provider failures from grounder calls', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => {
        throw new providerFailure_js_1.FatalProviderError({
            provider: 'openai',
            modelName: 'gpt-5.4-mini',
            statusCode: 401,
            detail: 'Unauthorized',
        });
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TAP,
        reason: 'Tap the account button.',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(result.error, 'AI provider error (openai/gpt-5.4-mini, HTTP 401): Unauthorized');
    strict_1.default.deepEqual(result.terminalFailure, {
        kind: 'provider',
        provider: 'openai',
        modelName: 'gpt-5.4-mini',
        statusCode: 401,
        message: 'AI provider error (openai/gpt-5.4-mini, HTTP 401): Unauthorized',
    });
    strict_1.default.equal(executedActions.length, 0);
    assertTraceNames(result.trace, ['action.ground']);
    strict_1.default.equal(result.trace?.spans[0]?.status, 'failure');
});
(0, node_test_1.default)('ActionExecutor resolves secret placeholders for text input only at the device boundary', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => ({
        output: { index: null },
        raw: '{}',
        trace: {
            totalMs: 14,
            promptBuildMs: 2,
            llmMs: 8,
            parseMs: 4,
        },
    }));
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
        runtimeBindings: {
            secrets: {
                email: 'person@example.com',
            },
            variables: {},
        },
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TYPE,
        reason: 'Type the login email.',
        text: '${secrets.email}',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.equal(executedActions[0].value, 'person@example.com');
    strict_1.default.equal(JSON.stringify(result).includes('person@example.com'), false);
    strict_1.default.equal(result.trace?.spans[0]?.detail?.includes('textLength='), true);
});
(0, node_test_1.default)('ActionExecutor keeps secret placeholders tokenized in deeplink traces while executing the resolved URL', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async () => {
        throw new Error('Grounder should not be called for deeplink actions');
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
        runtimeBindings: {
            secrets: {
                email: 'person@example.com',
            },
            variables: {},
        },
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_DEEPLINK,
        reason: 'Open the account recovery screen.',
        url: 'wikipedia://login?email=${secrets.email}',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.equal(executedActions[0].deeplink, 'wikipedia://login?email=person@example.com');
    strict_1.default.equal(result.trace?.spans[0]?.detail, 'url=wikipedia://login?email=${secrets.email}');
});
(0, node_test_1.default)('ActionExecutor surfaces terminal provider failures from visual grounding fallback', async () => {
    const executedActions = [];
    const agent = createAgent(executedActions);
    const aiAgent = createAiAgent(async (request) => {
        if (request.tracePhase === 'action.visual_fallback') {
            throw new providerFailure_js_1.FatalProviderError({
                provider: 'google',
                modelName: 'gemini-2.0-flash',
                statusCode: 400,
                detail: 'Bad Request',
            });
        }
        return {
            output: { needsVisualGrounding: true },
            raw: '{}',
            trace: {
                totalMs: 13,
                promptBuildMs: 2,
                llmMs: 8,
                parseMs: 3,
            },
        };
    });
    const executor = new ActionExecutor_js_1.ActionExecutor({
        agent,
        aiAgent,
        platform: 'android',
    });
    const result = await executor.executeAction({
        action: common_1.PLANNER_ACTION_TAP,
        reason: 'Tap the element that needs screenshot-only grounding.',
        screenshot: 'base64-image',
        screenWidth: 1080,
        screenHeight: 2400,
    });
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(result.error, 'AI provider error (google/gemini-2.0-flash, HTTP 400): Bad Request');
    strict_1.default.equal(result.terminalFailure?.statusCode, 400);
    strict_1.default.equal(executedActions.length, 0);
    assertTraceNames(result.trace, ['action.ground', 'action.visual_fallback']);
    strict_1.default.equal(result.trace?.spans[1]?.status, 'failure');
});
//# sourceMappingURL=ActionExecutor.test.js.map