"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@usb-ui-test/common");
const schemas_js_1 = require("./schemas.js");
// Schemas describe the inner shape directly — no outer `output` wrapper.
// See schemas.ts for why.
// ----------------------------------------------------------------------------
// Planner
// ----------------------------------------------------------------------------
(0, node_test_1.default)('planner schema accepts the canonical wait example from planner.md', () => {
    const payload = {
        thought: {
            plan: '[→ Wait for app to load]',
            think: 'App is on splash screen; need to wait.',
            act: 'Wait 5 seconds for the app to load.',
        },
        action: { action_type: 'wait', duration: 5 },
        remember: [],
    };
    strict_1.default.equal(schemas_js_1.PLANNER_SCHEMA.safeParse(payload).success, true);
});
(0, node_test_1.default)('planner schema accepts each documented action_type', () => {
    const types = [
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
    for (const t of types) {
        const payload = { action: { action_type: t } };
        strict_1.default.equal(schemas_js_1.PLANNER_SCHEMA.safeParse(payload).success, true, `expected ${t} to be accepted`);
    }
});
(0, node_test_1.default)('planner schema accepts passthrough action fields (repeat, delay_between_tap)', () => {
    const payload = {
        action: {
            action_type: 'tap',
            repeat: 3,
            delay_between_tap: 1000,
        },
        remember: [],
    };
    strict_1.default.equal(schemas_js_1.PLANNER_SCHEMA.safeParse(payload).success, true);
});
(0, node_test_1.default)('planner schema rejects an unknown action_type', () => {
    const payload = { action: { action_type: 'click' } };
    const result = schemas_js_1.PLANNER_SCHEMA.safeParse(payload);
    strict_1.default.equal(result.success, false);
});
(0, node_test_1.default)('planner schema rejects a payload with an outer output wrapper', () => {
    // Guard against reintroducing the double-wrapping bug.
    const payload = {
        output: {
            action: { action_type: 'tap' },
            remember: [],
        },
    };
    strict_1.default.equal(schemas_js_1.PLANNER_SCHEMA.safeParse(payload).success, false);
});
// ----------------------------------------------------------------------------
// Grounder — each feature's success and error shapes
// ----------------------------------------------------------------------------
(0, node_test_1.default)('grounder schema accepts index match, needsVisualGrounding, and error variants', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_GROUNDER);
    strict_1.default.equal(schema.safeParse({ index: 5, reason: 'match' }).success, true);
    strict_1.default.equal(schema.safeParse({ needsVisualGrounding: true, reason: 'not in list' })
        .success, true);
    strict_1.default.equal(schema.safeParse({ isError: true, reason: 'not visible' }).success, true);
});
(0, node_test_1.default)('input-focus grounder schema accepts index, x/y, null-index, and error', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_INPUT_FOCUS_GROUNDER);
    strict_1.default.equal(schema.safeParse({ index: 42, reason: 'match' }).success, true);
    strict_1.default.equal(schema.safeParse({ index: null, reason: 'already focused' }).success, true);
    strict_1.default.equal(schema.safeParse({ x: 100, y: 200, reason: 'derived' }).success, true);
    strict_1.default.equal(schema.safeParse({ isError: true, reason: 'not found' }).success, true);
});
(0, node_test_1.default)('visual grounder schema accepts coordinates and error', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_VISUAL_GROUNDER);
    strict_1.default.equal(schema.safeParse({ x: 540, y: 1200, reason: 'center of label' }).success, true);
    strict_1.default.equal(schema.safeParse({ isError: true, reason: 'not visible' }).success, true);
});
(0, node_test_1.default)('scroll-index grounder schema accepts swipe vector and error', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_SCROLL_INDEX_GROUNDER);
    strict_1.default.equal(schema.safeParse({
        start_x: 540,
        start_y: 1800,
        end_x: 540,
        end_y: 400,
        durationMs: 600,
        reason: 'swipe up',
    }).success, true);
    strict_1.default.equal(schema.safeParse({ isError: true, reason: 'no container' }).success, true);
});
(0, node_test_1.default)('launch-app grounder schema accepts minimal and full payloads', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_LAUNCH_APP_GROUNDER);
    strict_1.default.equal(schema.safeParse({ packageName: 'com.whatsapp', reason: 'exact match' })
        .success, true);
    strict_1.default.equal(schema.safeParse({
        packageName: 'com.example.myapp',
        clearState: true,
        allowAllPermissions: false,
        permissions: { camera: 'allow', photos: 'allow' },
        reason: 'full config',
    }).success, true);
    strict_1.default.equal(schema.safeParse({ isError: true, reason: 'not found' }).success, true);
});
(0, node_test_1.default)('set-location grounder schema accepts string coords and error', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_SET_LOCATION_GROUNDER);
    strict_1.default.equal(schema.safeParse({ lat: '37.7749', long: '-122.4194', reason: 'SF' })
        .success, true);
    strict_1.default.equal(schema.safeParse({ isError: true, reason: 'unresolved' }).success, true);
});
(0, node_test_1.default)('set-location grounder schema rejects numeric lat/long (spec requires strings)', () => {
    const schema = (0, schemas_js_1.schemaForFeature)(common_1.FEATURE_SET_LOCATION_GROUNDER);
    strict_1.default.equal(schema.safeParse({ lat: 37.7749, long: -122.4194, reason: 'numeric' })
        .success, false);
});
// ----------------------------------------------------------------------------
// Lookup
// ----------------------------------------------------------------------------
(0, node_test_1.default)('schemaForFeature returns a schema for every known feature', () => {
    for (const feature of common_1.ALL_FEATURES) {
        strict_1.default.ok((0, schemas_js_1.schemaForFeature)(feature), `missing schema for ${feature}`);
    }
    // Keep individual imports live so a future rename lands a compile error here.
    void common_1.FEATURE_PLANNER;
    void common_1.FEATURE_GROUNDER;
    void common_1.FEATURE_VISUAL_GROUNDER;
    void common_1.FEATURE_SCROLL_INDEX_GROUNDER;
    void common_1.FEATURE_INPUT_FOCUS_GROUNDER;
    void common_1.FEATURE_LAUNCH_APP_GROUNDER;
    void common_1.FEATURE_SET_LOCATION_GROUNDER;
});
//# sourceMappingURL=schemas.test.js.map