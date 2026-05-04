"use strict";
// selector.test.ts — exercises selector resolution against a fake hierarchy.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const common_1 = require("@usb-ui-test/common");
const selector_js_1 = require("./selector.js");
function fakeHierarchy(nodes) {
    // Hand-build a Hierarchy whose flattenedHierarchy is exactly `nodes`. This
    // skips the parser and lets each test focus on selector behavior.
    const flat = nodes.map((n, i) => new common_1.HierarchyNode({
        index: i,
        text: n.text ?? null,
        accessibilityText: n.accessibilityText ?? null,
        id: n.id ?? null,
        clazz: n.clazz ?? null,
        bounds: n.bounds ?? [0, 0, 100, 100],
    }));
    return new common_1.Hierarchy(null, flat);
}
(0, node_test_1.describe)('selector', () => {
    (0, node_test_1.it)('matches by exact text', () => {
        const h = fakeHierarchy([
            { text: 'Login', id: 'login_submit' },
            { text: 'Cancel' },
        ]);
        const node = (0, selector_js_1.resolveSelector)(h, { text: 'Login' });
        strict_1.default.equal(node.id, 'login_submit');
    });
    (0, node_test_1.it)('matches by id', () => {
        const h = fakeHierarchy([
            { text: 'Continue', id: 'submit' },
            { text: 'Continue', id: 'continue_alt' },
        ]);
        const node = (0, selector_js_1.resolveSelector)(h, { id: 'submit' });
        strict_1.default.equal(node.id, 'submit');
    });
    (0, node_test_1.it)('matches by accessibility label', () => {
        const h = fakeHierarchy([
            { accessibilityText: 'Login button', text: null, id: 'a' },
        ]);
        const node = (0, selector_js_1.resolveSelector)(h, { accessibility: 'Login button' });
        strict_1.default.equal(node.id, 'a');
    });
    (0, node_test_1.it)('matches by contains (substring)', () => {
        const h = fakeHierarchy([
            { text: 'Welcome back, Alice!', id: 'greet' },
        ]);
        const node = (0, selector_js_1.resolveSelector)(h, { contains: 'Welcome' });
        strict_1.default.equal(node.id, 'greet');
    });
    (0, node_test_1.it)('honors caseInsensitive on text and contains', () => {
        const h = fakeHierarchy([{ text: 'Sign In', id: 'login' }]);
        const node = (0, selector_js_1.resolveSelector)(h, {
            contains: 'sign in',
            caseInsensitive: true,
        });
        strict_1.default.equal(node.id, 'login');
    });
    (0, node_test_1.it)('disambiguates with index', () => {
        const h = fakeHierarchy([
            { text: 'OK', id: 'first' },
            { text: 'OK', id: 'second' },
        ]);
        strict_1.default.equal((0, selector_js_1.resolveSelector)(h, { text: 'OK', index: 0 }).id, 'first');
        strict_1.default.equal((0, selector_js_1.resolveSelector)(h, { text: 'OK', index: 1 }).id, 'second');
    });
    (0, node_test_1.it)('hasMatch returns false when nothing matches', () => {
        const h = fakeHierarchy([{ text: 'Cancel' }]);
        strict_1.default.equal((0, selector_js_1.hasMatch)(h, { text: 'Login' }), false);
    });
    (0, node_test_1.it)('throws SelectorNotFoundError with on-screen sample on miss', () => {
        const h = fakeHierarchy([{ text: 'Cancel' }, { text: 'Continue' }]);
        strict_1.default.throws(() => (0, selector_js_1.resolveSelector)(h, { text: 'Login' }), (err) => err instanceof selector_js_1.SelectorNotFoundError &&
            /Cancel/.test(err.message) &&
            /Continue/.test(err.message));
    });
    (0, node_test_1.it)('throws when index is out of range', () => {
        const h = fakeHierarchy([{ text: 'OK', id: 'first' }]);
        strict_1.default.throws(() => (0, selector_js_1.resolveSelector)(h, { text: 'OK', index: 5 }), /index 5 is out of range/);
    });
    (0, node_test_1.it)('findMatches returns nodes in flattened order', () => {
        const h = fakeHierarchy([
            { text: 'OK', id: 'a' },
            { text: 'Cancel', id: 'b' },
            { text: 'OK', id: 'c' },
        ]);
        const ids = (0, selector_js_1.findMatches)(h, { text: 'OK' }).map((n) => n.id);
        strict_1.default.deepEqual(ids, ['a', 'c']);
    });
});
//# sourceMappingURL=selector.test.js.map