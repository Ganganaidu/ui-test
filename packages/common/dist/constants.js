"use strict";
// Port of constants/lib/constants.dart — ONLY the CLI-relevant subset.
// The Dart file has 358 lines; we carry over ~30% used by CLI + goal-executor + device-node.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANNER_ACTION_BACK = exports.PLANNER_ACTION_SCROLL = exports.PLANNER_ACTION_TYPE = exports.PLANNER_ACTION_LONG_PRESS = exports.PLANNER_ACTION_TAP = exports.DEFAULT_SWIPE_DURATION_MS = exports.DEFAULT_STABILITY_CHECK_DELAY_MS = exports.DEFAULT_ACTION_TIMEOUT = exports.DEFAULT_GRPC_PORT_START = exports.DEFAULT_MAX_ITERATIONS = exports.PROVIDER_ENV_VARS = exports.MODEL_FORMAT_EXAMPLE = exports.SUPPORTED_AI_PROVIDERS_LABEL = exports.SUPPORTED_AI_PROVIDERS = exports.REASONING_LEVELS = exports.ALL_FEATURES = exports.FEATURE_SET_LOCATION_GROUNDER = exports.FEATURE_LAUNCH_APP_GROUNDER = exports.FEATURE_INPUT_FOCUS_GROUNDER = exports.FEATURE_SCROLL_INDEX_GROUNDER = exports.FEATURE_VISUAL_GROUNDER = exports.FEATURE_GROUNDER = exports.FEATURE_PLANNER = exports.STATUS_COMPLETED = exports.STATUS_RUNNING = exports.STATUS_ABORTED = exports.STATUS_ERROR = exports.STATUS_FAILURE = exports.STATUS_SUCCESS = exports.ACTION_TYPE_GET_APP_LIST = exports.ACTION_TYPE_GET_SCREENSHOT_AND_HIERARCHY = exports.ACTION_TYPE_CHECK_APP_IN_FOREGROUND = exports.ACTION_TYPE_SWITCH_TO_PRIMARY_APP = exports.ACTION_TYPE_DEEPLINK = exports.ACTION_TYPE_WAIT = exports.ACTION_TYPE_SET_LOCATION = exports.ACTION_TYPE_KILL_APP = exports.ACTION_TYPE_LAUNCH_APP = exports.ACTION_TYPE_PRESS_KEY = exports.ACTION_TYPE_HIDE_KEYBOARD = exports.ACTION_TYPE_ROTATE = exports.ACTION_TYPE_HOME = exports.ACTION_TYPE_BACK = exports.ACTION_TYPE_INPUT_TEXT = exports.ACTION_TYPE_SCROLL_ABS = exports.ACTION_TYPE_SCROLL = exports.ACTION_TYPE_LONG_PRESS = exports.ACTION_TYPE_TAP = exports.PLATFORM_IOS = exports.PLATFORM_ANDROID = void 0;
exports.ENV_DEBUG = exports.ENV_BASE_URL = exports.PLANNER_ACTION_DEEPLINK = exports.PLANNER_ACTION_FAILED = exports.PLANNER_ACTION_COMPLETED = exports.PLANNER_ACTION_WAIT = exports.PLANNER_ACTION_SET_LOCATION = exports.PLANNER_ACTION_LAUNCH_APP = exports.PLANNER_ACTION_PRESS_ENTER = exports.PLANNER_ACTION_HIDE_KEYBOARD = exports.PLANNER_ACTION_ROTATE = exports.PLANNER_ACTION_HOME = void 0;
exports.parseModel = parseModel;
exports.parseModelOptional = parseModelOptional;
// ============================================================================
// Platform identifiers
// ============================================================================
exports.PLATFORM_ANDROID = 'android';
exports.PLATFORM_IOS = 'ios';
// ============================================================================
// Action types — used by HeadlessActionExecutor to route actions
// Dart: class ActionType { static const String ... }
// ============================================================================
exports.ACTION_TYPE_TAP = 'tap';
exports.ACTION_TYPE_LONG_PRESS = 'longPress';
exports.ACTION_TYPE_SCROLL = 'scroll';
exports.ACTION_TYPE_SCROLL_ABS = 'scrollAbs';
exports.ACTION_TYPE_INPUT_TEXT = 'enterText';
exports.ACTION_TYPE_BACK = 'back';
exports.ACTION_TYPE_HOME = 'home';
exports.ACTION_TYPE_ROTATE = 'rotate';
exports.ACTION_TYPE_HIDE_KEYBOARD = 'hideKeyboard';
exports.ACTION_TYPE_PRESS_KEY = 'pressKey';
exports.ACTION_TYPE_LAUNCH_APP = 'launchApp';
exports.ACTION_TYPE_KILL_APP = 'killApp';
exports.ACTION_TYPE_SET_LOCATION = 'setLocation';
exports.ACTION_TYPE_WAIT = 'wait';
exports.ACTION_TYPE_DEEPLINK = 'deeplink';
exports.ACTION_TYPE_SWITCH_TO_PRIMARY_APP = 'switchToPrimaryApp';
exports.ACTION_TYPE_CHECK_APP_IN_FOREGROUND = 'checkAppInForeground';
exports.ACTION_TYPE_GET_SCREENSHOT_AND_HIERARCHY = 'getScreenshotAndHierarchy';
exports.ACTION_TYPE_GET_APP_LIST = 'getAppList';
// ============================================================================
// Status values — used by HeadlessGoalExecutor for step results
// ============================================================================
exports.STATUS_SUCCESS = 'success';
exports.STATUS_FAILURE = 'failure';
exports.STATUS_ERROR = 'error';
exports.STATUS_ABORTED = 'aborted';
exports.STATUS_RUNNING = 'running';
exports.STATUS_COMPLETED = 'completed';
// ============================================================================
// AI feature names — used by UsbUiTestAgent to select prompts/models
// ============================================================================
exports.FEATURE_PLANNER = 'planner';
exports.FEATURE_GROUNDER = 'grounder';
exports.FEATURE_VISUAL_GROUNDER = 'visual-grounder';
exports.FEATURE_SCROLL_INDEX_GROUNDER = 'scroll-index-grounder';
exports.FEATURE_INPUT_FOCUS_GROUNDER = 'input-focus-grounder';
exports.FEATURE_LAUNCH_APP_GROUNDER = 'launch-app-grounder';
exports.FEATURE_SET_LOCATION_GROUNDER = 'set-location-grounder';
exports.ALL_FEATURES = [
    exports.FEATURE_PLANNER,
    exports.FEATURE_GROUNDER,
    exports.FEATURE_VISUAL_GROUNDER,
    exports.FEATURE_SCROLL_INDEX_GROUNDER,
    exports.FEATURE_INPUT_FOCUS_GROUNDER,
    exports.FEATURE_LAUNCH_APP_GROUNDER,
    exports.FEATURE_SET_LOCATION_GROUNDER,
];
// ============================================================================
// Reasoning effort — unified level mapped per-provider inside AIAgent.
// 'minimal' is OpenAI-only; Google/Anthropic reject it at call time.
// ============================================================================
exports.REASONING_LEVELS = ['minimal', 'low', 'medium', 'high'];
// ============================================================================
// AI provider identifiers and shared model-string parsing. Lives here so
// both the CLI (workspace config, --model flag) and the goal-executor
// (per-feature overrides) can validate model strings with identical errors.
// ============================================================================
exports.SUPPORTED_AI_PROVIDERS = ['openai', 'google', 'anthropic'];
exports.SUPPORTED_AI_PROVIDERS_LABEL = exports.SUPPORTED_AI_PROVIDERS.join(', ');
exports.MODEL_FORMAT_EXAMPLE = 'google/gemini-3-flash-preview';
exports.PROVIDER_ENV_VARS = {
    openai: 'OPENAI_API_KEY',
    google: 'GOOGLE_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
};
/**
 * Parse a `provider/model` string (e.g. `openai/gpt-5.4-mini`) into its
 * provider and model name. Validates that both halves are non-empty after
 * trimming and that the provider is one of `SUPPORTED_AI_PROVIDERS`.
 *
 * @param modelStr the raw string from YAML or the CLI `--model` flag
 * @param label optional context prefix for errors (e.g. `features.planner.model`).
 *              When omitted, errors read as CLI-style (`--model is required...`).
 */
function parseModel(modelStr, label) {
    const normalizedModel = modelStr?.trim();
    if (!normalizedModel) {
        throw new Error(label
            ? `${label} is required. Use provider/model, for example ${exports.MODEL_FORMAT_EXAMPLE}. Supported providers: ${exports.SUPPORTED_AI_PROVIDERS_LABEL}.`
            : `--model is required. Use provider/model, for example ${exports.MODEL_FORMAT_EXAMPLE}. Supported providers: ${exports.SUPPORTED_AI_PROVIDERS_LABEL}.`);
    }
    const segments = normalizedModel.split('/');
    if (segments.length !== 2 ||
        segments[0] === undefined ||
        segments[1] === undefined ||
        segments[0].trim() === '' ||
        segments[1].trim() === '') {
        const detail = `Expected provider/model with non-empty provider and model name. Supported providers: ${exports.SUPPORTED_AI_PROVIDERS_LABEL}.`;
        throw new Error(label
            ? `${label} has invalid model format: "${normalizedModel}". ${detail}`
            : `Invalid model format: "${normalizedModel}". ${detail}`);
    }
    const provider = segments[0].trim();
    const modelName = segments[1].trim();
    if (!exports.SUPPORTED_AI_PROVIDERS.includes(provider)) {
        throw new Error(label
            ? `${label} has unsupported AI provider: "${provider}". Supported providers: ${exports.SUPPORTED_AI_PROVIDERS_LABEL}.`
            : `Unsupported AI provider: "${provider}". Supported providers: ${exports.SUPPORTED_AI_PROVIDERS_LABEL}.`);
    }
    return { provider: provider, modelName };
}
/**
 * Like {@link parseModel} but returns `undefined` instead of throwing when
 * `modelStr` is absent or blank. Use this in the CLI entry-point so that
 * deterministic tests (which need no AI provider) can run without `--model`.
 * Format and provider errors are still thrown immediately so typos surface early.
 */
function parseModelOptional(modelStr, label) {
    if (!modelStr?.trim())
        return undefined;
    return parseModel(modelStr, label);
}
// ============================================================================
// Defaults
// ============================================================================
exports.DEFAULT_MAX_ITERATIONS = 110;
exports.DEFAULT_GRPC_PORT_START = 50051;
exports.DEFAULT_ACTION_TIMEOUT = 30;
exports.DEFAULT_STABILITY_CHECK_DELAY_MS = 500;
exports.DEFAULT_SWIPE_DURATION_MS = 500;
// ============================================================================
// Planner output action keys — used by HeadlessGoalExecutor to parse planner response
// These must match the strings the planner LLM outputs.
// ============================================================================
exports.PLANNER_ACTION_TAP = 'tap';
exports.PLANNER_ACTION_LONG_PRESS = 'longPress';
exports.PLANNER_ACTION_TYPE = 'type';
exports.PLANNER_ACTION_SCROLL = 'scroll';
exports.PLANNER_ACTION_BACK = 'back';
exports.PLANNER_ACTION_HOME = 'home';
exports.PLANNER_ACTION_ROTATE = 'rotate';
exports.PLANNER_ACTION_HIDE_KEYBOARD = 'hideKeyboard';
exports.PLANNER_ACTION_PRESS_ENTER = 'pressEnter';
exports.PLANNER_ACTION_LAUNCH_APP = 'launchApp';
exports.PLANNER_ACTION_SET_LOCATION = 'setLocation';
exports.PLANNER_ACTION_WAIT = 'wait';
exports.PLANNER_ACTION_COMPLETED = 'completed';
exports.PLANNER_ACTION_FAILED = 'failed';
exports.PLANNER_ACTION_DEEPLINK = 'deeplink';
// ============================================================================
// Environment variable keys
// ============================================================================
exports.ENV_BASE_URL = 'BASE_URL';
exports.ENV_DEBUG = 'DEBUG';
//# sourceMappingURL=constants.js.map