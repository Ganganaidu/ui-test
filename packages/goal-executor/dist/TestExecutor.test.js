"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const TestExecutor_js_1 = require("./TestExecutor.js");
const providerFailure_js_1 = require("./ai/providerFailure.js");
function createAgent(responses) {
    let responseIndex = 0;
    return {
        async setUp() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async executeAction(request) {
            strict_1.default.equal(request.action instanceof common_1.GetScreenshotAndHierarchyAction, true);
            const response = responses[responseIndex] ??
                responses[responses.length - 1];
            responseIndex += 1;
            return response;
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
function createAiAgent(planImpl) {
    return {
        plan: planImpl,
    };
}
function createGoalAgent(params) {
    let responseIndex = 0;
    return {
        async setUp() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async executeAction(request) {
            if (request.action instanceof common_1.GetScreenshotAndHierarchyAction) {
                const response = params.captureResponses[responseIndex] ??
                    params.captureResponses[params.captureResponses.length - 1];
                responseIndex += 1;
                return response;
            }
            params.executedActions?.push(request.action);
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
(0, node_test_1.default)('TestExecutor continues after a transient capture failure and recovers next iteration', async () => {
    const agent = createAgent([
        new common_1.DeviceNodeResponse({
            success: false,
            message: 'UiAutomation not connected',
        }),
        new common_1.DeviceNodeResponse({
            success: true,
            data: {
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        }),
    ]);
    let plannerCalls = 0;
    const aiAgent = createAiAgent(async () => {
        plannerCalls += 1;
        return {
            act: common_1.PLANNER_ACTION_COMPLETED,
            reason: 'Hindi added successfully',
            remember: [],
        };
    });
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Add Hindi',
        platform: 'android',
        maxIterations: 3,
        agent,
        aiAgent,
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(result.totalIterations, 2);
    strict_1.default.equal(plannerCalls, 1);
    strict_1.default.equal(result.steps[0]?.action, 'captureDeviceState');
    strict_1.default.equal(result.steps[0]?.success, false);
    strict_1.default.equal(result.steps[0]?.trace?.status, 'failure');
    strict_1.default.equal(result.steps[0]?.trace?.failureReason, 'UiAutomation not connected');
    strict_1.default.ok(result.steps[0]?.trace?.spans.some((span) => span.name === 'capture.total'));
});
(0, node_test_1.default)('TestExecutor passes pre-context and app knowledge through to the planner', async () => {
    const agent = createAgent([
        new common_1.DeviceNodeResponse({
            success: true,
            data: {
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        }),
    ]);
    let plannerRequest;
    const aiAgent = {
        async plan(request) {
            plannerRequest = request;
            return {
                act: common_1.PLANNER_ACTION_COMPLETED,
                reason: 'Done',
                remember: [],
            };
        },
    };
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Open the app',
        platform: 'android',
        maxIterations: 1,
        agent,
        aiAgent,
        preContext: 'The CLI already launched Android package "org.wikipedia".',
        appKnowledge: 'This app opens to the Explore screen.',
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(plannerRequest?.preContext, 'The CLI already launched Android package "org.wikipedia".');
    strict_1.default.equal(plannerRequest?.appKnowledge, 'This app opens to the Explore screen.');
});
(0, node_test_1.default)('TestExecutor aborts immediately on fatal capture/setup failure', async () => {
    const agent = createAgent([
        new common_1.DeviceNodeResponse({
            success: false,
            message: 'gRPC client not connected',
        }),
    ]);
    const aiAgent = createAiAgent(async () => {
        throw new Error('Planner should not be called on fatal capture failure');
    });
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Add Hindi',
        platform: 'android',
        maxIterations: 3,
        agent,
        aiAgent,
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(result.message, 'gRPC client not connected');
    strict_1.default.equal(result.totalIterations, 1);
    strict_1.default.equal(result.steps[0]?.action, 'captureDeviceState');
});
(0, node_test_1.default)('TestExecutor fails immediately on terminal planner provider errors', async () => {
    const agent = createAgent([
        new common_1.DeviceNodeResponse({
            success: true,
            data: {
                screenshot: 'image',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
            },
        }),
    ]);
    const aiAgent = createAiAgent(async () => {
        throw new providerFailure_js_1.FatalProviderError({
            provider: 'openai',
            modelName: 'gpt-5.4-mini',
            statusCode: 401,
            detail: 'Unauthorized',
        });
    });
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Add Hindi',
        platform: 'android',
        maxIterations: 3,
        agent,
        aiAgent,
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(result.status, 'failure');
    strict_1.default.equal(result.message, 'AI provider error (openai/gpt-5.4-mini, HTTP 401): Unauthorized');
    strict_1.default.equal(result.terminalFailure?.statusCode, 401);
    strict_1.default.equal(result.totalIterations, 1);
    strict_1.default.equal(result.steps[0]?.action, 'plannerError');
    strict_1.default.equal(result.steps[0]?.errorMessage, 'AI provider error (openai/gpt-5.4-mini, HTTP 401): Unauthorized');
});
(0, node_test_1.default)('TestExecutor fails immediately on terminal grounder provider errors', async () => {
    const executedActions = [];
    const agent = createGoalAgent({
        captureResponses: [
            new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    screenshot: 'image',
                    hierarchy: '[]',
                    screenWidth: 1080,
                    screenHeight: 2400,
                },
            }),
        ],
        executedActions,
    });
    const aiAgent = {
        async plan() {
            return {
                act: common_1.PLANNER_ACTION_TAP,
                reason: 'Tap the language option.',
                remember: [],
            };
        },
        async ground() {
            throw new providerFailure_js_1.FatalProviderError({
                provider: 'anthropic',
                modelName: 'claude-3-7-sonnet',
                statusCode: 400,
                detail: 'Bad Request',
            });
        },
    };
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Add Hindi',
        platform: 'android',
        maxIterations: 3,
        agent,
        aiAgent,
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, false);
    strict_1.default.equal(result.status, 'failure');
    strict_1.default.equal(result.message, 'AI provider error (anthropic/claude-3-7-sonnet, HTTP 400): Bad Request');
    strict_1.default.equal(result.terminalFailure?.statusCode, 400);
    strict_1.default.equal(result.totalIterations, 1);
    strict_1.default.equal(result.steps[0]?.action, 'tap');
    strict_1.default.equal(result.steps[0]?.errorMessage, 'AI provider error (anthropic/claude-3-7-sonnet, HTTP 400): Bad Request');
    strict_1.default.equal(executedActions.length, 0);
});
(0, node_test_1.default)('TestExecutor emits debug step trace logs and summary timings', async (t) => {
    const executedActions = [];
    const agent = createGoalAgent({
        captureResponses: [
            new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    screenshot: 'image-pre-step-1',
                    hierarchy: '[]',
                    screenWidth: 1080,
                    screenHeight: 2400,
                    captureTrace: {
                        totalMs: 40,
                        stabilityMs: 14,
                        finalPayloadMs: 26,
                        stable: true,
                        pollCount: 2,
                        attempts: 1,
                    },
                },
            }),
            new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    screenshot: 'image-post-step-1',
                    hierarchy: '[]',
                    screenWidth: 1080,
                    screenHeight: 2400,
                    captureTrace: {
                        totalMs: 28,
                        stabilityMs: 9,
                        finalPayloadMs: 19,
                        stable: true,
                        pollCount: 2,
                        attempts: 1,
                    },
                },
            }),
            new common_1.DeviceNodeResponse({
                success: true,
                data: {
                    screenshot: 'image-step-2',
                    hierarchy: '[]',
                    screenWidth: 1080,
                    screenHeight: 2400,
                    captureTrace: {
                        totalMs: 32,
                        stabilityMs: 10,
                        finalPayloadMs: 22,
                        stable: true,
                        pollCount: 2,
                        attempts: 1,
                    },
                },
            }),
        ],
        executedActions,
    });
    let planCalls = 0;
    const aiAgent = {
        async plan() {
            planCalls += 1;
            if (planCalls === 1) {
                return {
                    act: common_1.PLANNER_ACTION_TAP,
                    reason: 'Tap the Add language button.',
                    remember: [],
                    trace: {
                        totalMs: 55,
                        promptBuildMs: 9,
                        llmMs: 39,
                        parseMs: 7,
                    },
                };
            }
            return {
                act: common_1.PLANNER_ACTION_COMPLETED,
                reason: 'Hindi added successfully',
                remember: [],
                trace: {
                    totalMs: 31,
                    promptBuildMs: 5,
                    llmMs: 21,
                    parseMs: 5,
                },
            };
        },
        async ground() {
            return {
                output: { x: 120, y: 260 },
                raw: '{}',
                trace: {
                    totalMs: 24,
                    promptBuildMs: 4,
                    llmMs: 15,
                    parseMs: 5,
                },
            };
        },
    };
    const logs = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    common_1.Logger.init({ level: common_1.LogLevel.DEBUG, tag: 'usb-ui-test' });
    console.log = (...args) => {
        logs.push(args.map(String).join(' '));
    };
    console.warn = (...args) => {
        logs.push(args.map(String).join(' '));
    };
    t.after(() => {
        console.log = originalLog;
        console.warn = originalWarn;
        common_1.Logger.init({ level: common_1.LogLevel.INFO, tag: 'usb-ui-test' });
    });
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Add Hindi',
        platform: 'android',
        maxIterations: 3,
        agent,
        aiAgent,
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(result.totalIterations, 2);
    strict_1.default.equal(executedActions.length, 1);
    strict_1.default.equal(result.steps[0]?.action, common_1.PLANNER_ACTION_TAP);
    strict_1.default.equal(result.steps[0]?.screenshot, 'image-post-step-1');
    const spanNames = new Set(result.steps[0]?.trace?.spans.map((span) => span.name) ?? []);
    strict_1.default.equal(spanNames.size, 13);
    for (const expectedName of [
        'step.total',
        'capture.total',
        'capture.stability',
        'capture.final_payload',
        'planning.total',
        'planning.llm',
        'planning.parse',
        'action.total',
        'action.ground',
        'action.device',
        'post_capture.total',
        'post_capture.stability',
        'post_capture.final_payload',
    ]) {
        strict_1.default.ok(spanNames.has(expectedName), `missing span ${expectedName}`);
    }
    strict_1.default.ok(logs.some((line) => line.includes('[trace step=1 phase=capture.total] start')));
    strict_1.default.ok(logs.some((line) => line.includes('[trace step=1 phase=action.device] done')));
    const summaryLine = logs.find((line) => line.includes('[trace step=1] summary'));
    strict_1.default.ok(summaryLine);
    strict_1.default.match(summaryLine, /capture=\d+ms\(stability=\d+ms,final_payload=\d+ms\)/);
    strict_1.default.match(summaryLine, /planning=\d+ms\(llm=\d+ms,parse=\d+ms\)/);
    strict_1.default.match(summaryLine, /action=\d+ms\(ground=\d+ms,device=\d+ms\)/);
    strict_1.default.match(summaryLine, /post_capture=\d+ms\(stability=\d+ms,final_payload=\d+ms\)/);
    strict_1.default.match(summaryLine, /result=success action=tap/);
});
(0, node_test_1.default)('TestExecutor records completed-step metadata for reporting', async () => {
    const agent = createAgent([
        new common_1.DeviceNodeResponse({
            success: true,
            data: {
                screenshot: 'image-step-1',
                hierarchy: '[]',
                screenWidth: 1080,
                screenHeight: 2400,
                captureTrace: {
                    totalMs: 36,
                    stabilityMs: 12,
                    finalPayloadMs: 24,
                    stable: true,
                    pollCount: 2,
                    attempts: 1,
                },
            },
        }),
    ]);
    const aiAgent = createAiAgent(async () => ({
        act: common_1.PLANNER_ACTION_COMPLETED,
        reason: 'Login flow completed successfully',
        analysis: 'The user reached the feed after login.',
        remember: [],
        text: '${secrets.email}',
        thought: {
            plan: 'Check whether login is already complete.',
            think: 'The feed is visible and no further action is needed.',
            act: 'Mark the test as complete.',
        },
        trace: {
            totalMs: 28,
            promptBuildMs: 4,
            llmMs: 18,
            parseMs: 6,
        },
    }));
    const executor = new TestExecutor_js_1.TestExecutor({
        goal: 'Log in and verify the feed',
        platform: 'android',
        maxIterations: 2,
        agent,
        aiAgent,
    });
    const result = await executor.executeGoal();
    strict_1.default.equal(result.success, true);
    strict_1.default.equal(result.platform, 'android');
    strict_1.default.ok(result.startedAt);
    strict_1.default.ok(result.completedAt);
    strict_1.default.equal(result.analysis, 'The user reached the feed after login.');
    strict_1.default.equal(result.steps.length, 1);
    strict_1.default.equal(result.steps[0]?.screenshot, 'image-step-1');
    strict_1.default.equal(result.steps[0]?.analysis, 'The user reached the feed after login.');
    strict_1.default.deepEqual(result.steps[0]?.thought, {
        plan: 'Check whether login is already complete.',
        think: 'The feed is visible and no further action is needed.',
        act: 'Mark the test as complete.',
    });
    strict_1.default.deepEqual(result.steps[0]?.actionPayload, {
        text: '${secrets.email}',
        url: undefined,
        direction: undefined,
        clearText: undefined,
        durationSeconds: undefined,
        repeat: undefined,
        delayBetweenTapMs: undefined,
    });
    strict_1.default.ok(result.steps[0]?.timestamp);
    strict_1.default.ok(result.steps[0]?.durationMs !== undefined);
    strict_1.default.ok(result.steps[0]?.trace);
});
//# sourceMappingURL=TestExecutor.test.js.map