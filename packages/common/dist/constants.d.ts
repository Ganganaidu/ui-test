export declare const PLATFORM_ANDROID = "android";
export declare const PLATFORM_IOS = "ios";
export declare const ACTION_TYPE_TAP = "tap";
export declare const ACTION_TYPE_LONG_PRESS = "longPress";
export declare const ACTION_TYPE_SCROLL = "scroll";
export declare const ACTION_TYPE_SCROLL_ABS = "scrollAbs";
export declare const ACTION_TYPE_INPUT_TEXT = "enterText";
export declare const ACTION_TYPE_BACK = "back";
export declare const ACTION_TYPE_HOME = "home";
export declare const ACTION_TYPE_ROTATE = "rotate";
export declare const ACTION_TYPE_HIDE_KEYBOARD = "hideKeyboard";
export declare const ACTION_TYPE_PRESS_KEY = "pressKey";
export declare const ACTION_TYPE_LAUNCH_APP = "launchApp";
export declare const ACTION_TYPE_KILL_APP = "killApp";
export declare const ACTION_TYPE_SET_LOCATION = "setLocation";
export declare const ACTION_TYPE_WAIT = "wait";
export declare const ACTION_TYPE_DEEPLINK = "deeplink";
export declare const ACTION_TYPE_SWITCH_TO_PRIMARY_APP = "switchToPrimaryApp";
export declare const ACTION_TYPE_CHECK_APP_IN_FOREGROUND = "checkAppInForeground";
export declare const ACTION_TYPE_GET_SCREENSHOT_AND_HIERARCHY = "getScreenshotAndHierarchy";
export declare const ACTION_TYPE_GET_APP_LIST = "getAppList";
export declare const STATUS_SUCCESS = "success";
export declare const STATUS_FAILURE = "failure";
export declare const STATUS_ERROR = "error";
export declare const STATUS_ABORTED = "aborted";
export declare const STATUS_RUNNING = "running";
export declare const STATUS_COMPLETED = "completed";
export declare const FEATURE_PLANNER = "planner";
export declare const FEATURE_GROUNDER = "grounder";
export declare const FEATURE_VISUAL_GROUNDER = "visual-grounder";
export declare const FEATURE_SCROLL_INDEX_GROUNDER = "scroll-index-grounder";
export declare const FEATURE_INPUT_FOCUS_GROUNDER = "input-focus-grounder";
export declare const FEATURE_LAUNCH_APP_GROUNDER = "launch-app-grounder";
export declare const FEATURE_SET_LOCATION_GROUNDER = "set-location-grounder";
export declare const ALL_FEATURES: readonly ["planner", "grounder", "visual-grounder", "scroll-index-grounder", "input-focus-grounder", "launch-app-grounder", "set-location-grounder"];
export type FeatureName = (typeof ALL_FEATURES)[number];
export declare const REASONING_LEVELS: readonly ["minimal", "low", "medium", "high"];
export type ReasoningLevel = (typeof REASONING_LEVELS)[number];
export declare const SUPPORTED_AI_PROVIDERS: readonly ["openai", "google", "anthropic"];
export type SupportedProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];
export declare const SUPPORTED_AI_PROVIDERS_LABEL: string;
export declare const MODEL_FORMAT_EXAMPLE = "google/gemini-3-flash-preview";
export declare const PROVIDER_ENV_VARS: Record<SupportedProvider, string>;
export interface ParsedModel {
    provider: SupportedProvider;
    modelName: string;
}
/**
 * Parse a `provider/model` string (e.g. `openai/gpt-5.4-mini`) into its
 * provider and model name. Validates that both halves are non-empty after
 * trimming and that the provider is one of `SUPPORTED_AI_PROVIDERS`.
 *
 * @param modelStr the raw string from YAML or the CLI `--model` flag
 * @param label optional context prefix for errors (e.g. `features.planner.model`).
 *              When omitted, errors read as CLI-style (`--model is required...`).
 */
export declare function parseModel(modelStr: string | undefined, label?: string): ParsedModel;
/**
 * Like {@link parseModel} but returns `undefined` instead of throwing when
 * `modelStr` is absent or blank. Use this in the CLI entry-point so that
 * deterministic tests (which need no AI provider) can run without `--model`.
 * Format and provider errors are still thrown immediately so typos surface early.
 */
export declare function parseModelOptional(modelStr: string | undefined, label?: string): ParsedModel | undefined;
/**
 * Per-feature override resolved from `features:` in .usb-ui-test/config.yaml.
 * Each field is optional; unset fields inherit workspace-level defaults.
 * `model` is a "provider/modelName" string (validated via parseModel at use site).
 */
export interface FeatureOverride {
    model?: string;
    reasoning?: ReasoningLevel;
}
export type FeatureOverrides = Partial<Record<FeatureName, FeatureOverride>>;
export interface ModelDefaults {
    provider: string;
    modelName: string;
    reasoning?: ReasoningLevel;
}
export declare const DEFAULT_MAX_ITERATIONS = 110;
export declare const DEFAULT_GRPC_PORT_START = 50051;
export declare const DEFAULT_ACTION_TIMEOUT = 30;
export declare const DEFAULT_STABILITY_CHECK_DELAY_MS = 500;
export declare const DEFAULT_SWIPE_DURATION_MS = 500;
export declare const PLANNER_ACTION_TAP = "tap";
export declare const PLANNER_ACTION_LONG_PRESS = "longPress";
export declare const PLANNER_ACTION_TYPE = "type";
export declare const PLANNER_ACTION_SCROLL = "scroll";
export declare const PLANNER_ACTION_BACK = "back";
export declare const PLANNER_ACTION_HOME = "home";
export declare const PLANNER_ACTION_ROTATE = "rotate";
export declare const PLANNER_ACTION_HIDE_KEYBOARD = "hideKeyboard";
export declare const PLANNER_ACTION_PRESS_ENTER = "pressEnter";
export declare const PLANNER_ACTION_LAUNCH_APP = "launchApp";
export declare const PLANNER_ACTION_SET_LOCATION = "setLocation";
export declare const PLANNER_ACTION_WAIT = "wait";
export declare const PLANNER_ACTION_COMPLETED = "completed";
export declare const PLANNER_ACTION_FAILED = "failed";
export declare const PLANNER_ACTION_DEEPLINK = "deeplink";
export declare const ENV_BASE_URL = "BASE_URL";
export declare const ENV_DEBUG = "DEBUG";
//# sourceMappingURL=constants.d.ts.map