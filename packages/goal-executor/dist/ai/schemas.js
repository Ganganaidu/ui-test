"use strict";
// Zod schemas for LLM structured output on the Anthropic path.
//
// The Vercel AI SDK's Anthropic adapter (`@ai-sdk/anthropic`) cannot enforce
// JSON output without a schema — Anthropic has no schema-less JSON mode. When
// a schema is supplied, the adapter routes through Anthropic's structured-
// output APIs (`output_format` or a `json` tool, depending on
// `structuredOutputMode`) so Claude emits exactly one well-formed JSON object.
//
// OpenAI (`response_format: json_object`) and Google
// (`response_mime_type: application/json`) work schema-less today, so this
// file is only consumed on the Anthropic call path in `AIAgent._callLLM`.
//
// IMPORTANT — no outer `output` wrapper.
// The prompts tell the model to emit `{"output": {...}}` because OpenAI and
// Google are in text-JSON mode and the parsers look for that convention.
// On the Anthropic structured-output path, the schema IS the shape of the
// tool call arguments (or the `output_format` payload) — adding an `output`
// wrapper here causes Claude to nest twice: `{"output":{"output":{...}}}`.
// Schemas below describe the inner shape directly; `_parsePlannerResponse`
// and `_parseGrounderResponse` already accept both wrapped and unwrapped
// shapes via their fallback branches.
//
// Each schema mirrors the corresponding prompt in `src/prompts/*.md`. When
// a prompt changes, update the matching schema here.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANNER_SCHEMA = void 0;
exports.schemaForFeature = schemaForFeature;
const zod_1 = require("zod");
const common_1 = require("@usb-ui-test/common");
// ----------------------------------------------------------------------------
// Planner — canonical shape from `prompts/planner.md` <output_schema>
// ----------------------------------------------------------------------------
const PLANNER_ACTION_TYPES = [
    'tap',
    'long_press',
    'input_text',
    'swipe',
    'navigate_back',
    'navigate_home',
    'rotate',
    'hide_keyboard',
    'keyboard_enter',
    'wait',
    'deep_link',
    'set_location',
    'launch_app',
    'status',
];
const plannerActionSchema = zod_1.z
    .object({
    action_type: zod_1.z.enum(PLANNER_ACTION_TYPES),
})
    .passthrough();
const plannerThoughtSchema = zod_1.z
    .object({
    plan: zod_1.z.string().optional(),
    think: zod_1.z.string().optional(),
    act: zod_1.z.string().optional(),
})
    .passthrough();
exports.PLANNER_SCHEMA = zod_1.z.object({
    thought: plannerThoughtSchema.optional(),
    action: plannerActionSchema,
    remember: zod_1.z.array(zod_1.z.string()).optional(),
});
// ----------------------------------------------------------------------------
// Grounder — per-feature shapes from the grounder prompt files
// ----------------------------------------------------------------------------
// Numeric fields use plain z.number() — Anthropic's tool-schema validator
// rejects `minimum`/`maximum` keywords on the `integer` type, and zod v4's
// .int() emits those bounds by default. Downstream parsers already coerce
// to integers where needed (ActionExecutor + GrounderResponseConverter).
const errorShape = zod_1.z.object({
    isError: zod_1.z.literal(true),
    reason: zod_1.z.string(),
});
// `FEATURE_GROUNDER` — `prompts/grounder.md`
// Three success variants: visual-fallback, index match, or error.
const grounderSchema = zod_1.z.union([
    errorShape,
    zod_1.z
        .object({
        needsVisualGrounding: zod_1.z.literal(true),
        reason: zod_1.z.string(),
    })
        .passthrough(),
    zod_1.z
        .object({
        index: zod_1.z.number(),
        reason: zod_1.z.string().optional(),
    })
        .passthrough(),
]);
// `FEATURE_INPUT_FOCUS_GROUNDER` — `prompts/input-focus-grounder.md`
// Variants: index match, null index (already focused), x/y coords, or error.
const inputFocusGrounderSchema = zod_1.z.union([
    errorShape,
    zod_1.z
        .object({
        index: zod_1.z.number().nullable(),
        reason: zod_1.z.string().optional(),
    })
        .passthrough(),
    zod_1.z
        .object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
        reason: zod_1.z.string().optional(),
    })
        .passthrough(),
]);
// `FEATURE_VISUAL_GROUNDER` — `prompts/visual-grounder.md`
const visualGrounderSchema = zod_1.z.union([
    errorShape,
    zod_1.z
        .object({
        x: zod_1.z.number(),
        y: zod_1.z.number(),
        reason: zod_1.z.string().optional(),
    })
        .passthrough(),
]);
// `FEATURE_SCROLL_INDEX_GROUNDER` — `prompts/scroll-grounder.md`
const scrollIndexGrounderSchema = zod_1.z.union([
    errorShape,
    zod_1.z
        .object({
        start_x: zod_1.z.number(),
        start_y: zod_1.z.number(),
        end_x: zod_1.z.number(),
        end_y: zod_1.z.number(),
        durationMs: zod_1.z.number(),
        reason: zod_1.z.string().optional(),
    })
        .passthrough(),
]);
// `FEATURE_LAUNCH_APP_GROUNDER` — `prompts/launch-app-grounder.md`
// Keep permissions and arguments as permissive records; the prompt documents
// free-form values.
const launchAppGrounderSchema = zod_1.z.union([
    errorShape,
    zod_1.z
        .object({
        packageName: zod_1.z.string(),
        reason: zod_1.z.string().optional(),
        clearState: zod_1.z.boolean().optional(),
        allowAllPermissions: zod_1.z.boolean().optional(),
        stopAppBeforeLaunch: zod_1.z.boolean().optional(),
        shouldUninstallBeforeLaunch: zod_1.z.boolean().optional(),
        permissions: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
        arguments: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    })
        .passthrough(),
]);
// `FEATURE_SET_LOCATION_GROUNDER` — `prompts/set-location-grounder.md`
// lat/long are strings by spec (4-6 decimal places).
const setLocationGrounderSchema = zod_1.z.union([
    errorShape,
    zod_1.z
        .object({
        lat: zod_1.z.string(),
        long: zod_1.z.string(),
        reason: zod_1.z.string().optional(),
    })
        .passthrough(),
]);
// ----------------------------------------------------------------------------
// Lookup
// ----------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FEATURE_SCHEMAS = {
    [common_1.FEATURE_PLANNER]: exports.PLANNER_SCHEMA,
    [common_1.FEATURE_GROUNDER]: grounderSchema,
    [common_1.FEATURE_INPUT_FOCUS_GROUNDER]: inputFocusGrounderSchema,
    [common_1.FEATURE_VISUAL_GROUNDER]: visualGrounderSchema,
    [common_1.FEATURE_SCROLL_INDEX_GROUNDER]: scrollIndexGrounderSchema,
    [common_1.FEATURE_LAUNCH_APP_GROUNDER]: launchAppGrounderSchema,
    [common_1.FEATURE_SET_LOCATION_GROUNDER]: setLocationGrounderSchema,
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function schemaForFeature(feature) {
    const schema = FEATURE_SCHEMAS[feature];
    if (!schema) {
        throw new Error(`No schema registered for feature "${feature}".`);
    }
    return schema;
}
//# sourceMappingURL=schemas.js.map