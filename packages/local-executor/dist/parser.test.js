"use strict";
// parser.test.ts — node:test specs for mode detection + step parsing.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const parser_js_1 = require("./parser.js");
(0, node_test_1.describe)('detectMode', () => {
    (0, node_test_1.it)('flags all-string steps as ai mode', () => {
        strict_1.default.equal((0, parser_js_1.detectMode)(['Tap login', 'Type my email']), 'ai');
    });
    (0, node_test_1.it)('flags all-structured steps as deterministic', () => {
        strict_1.default.equal((0, parser_js_1.detectMode)([{ tapOn: 'Login' }, { inputText: 'foo' }]), 'deterministic');
    });
    (0, node_test_1.it)('treats empty list as ai (so existing tests keep working)', () => {
        strict_1.default.equal((0, parser_js_1.detectMode)([]), 'ai');
    });
    (0, node_test_1.it)('throws on mixed string + structured input', () => {
        strict_1.default.throws(() => (0, parser_js_1.detectMode)(['tap login', { tapOn: 'Login' }]), /mix natural-language strings and structured commands/);
    });
    (0, node_test_1.it)('rejects entries that are neither strings nor recognized commands', () => {
        strict_1.default.throws(() => (0, parser_js_1.detectMode)([42]), /step\[0\] is neither a structured command/);
    });
});
(0, node_test_1.describe)('parseStructuredSteps', () => {
    (0, node_test_1.it)('parses tapOn with shorthand string selector', () => {
        const out = (0, parser_js_1.parseStructuredSteps)([{ tapOn: 'Login' }]);
        strict_1.default.deepEqual(out, [{ kind: 'tapOn', selector: { text: 'Login' } }]);
    });
    (0, node_test_1.it)('parses tapOn with explicit selector mapping', () => {
        const out = (0, parser_js_1.parseStructuredSteps)([
            { tapOn: { id: 'login_submit', caseInsensitive: true } },
        ]);
        strict_1.default.deepEqual(out, [
            {
                kind: 'tapOn',
                selector: { id: 'login_submit', caseInsensitive: true },
            },
        ]);
    });
    (0, node_test_1.it)('rejects tapOn selector with no fields', () => {
        strict_1.default.throws(() => (0, parser_js_1.parseStructuredSteps)([{ tapOn: {} }]), /requires at least one of/);
    });
    (0, node_test_1.it)('parses inputText shorthand and full form', () => {
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([{ inputText: 'qa@example.com' }]), [{ kind: 'inputText', value: 'qa@example.com' }]);
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([
            { inputText: { value: 'pw', into: { id: 'pw' }, clear: true } },
        ]), [
            {
                kind: 'inputText',
                value: 'pw',
                into: { id: 'pw' },
                clear: true,
            },
        ]);
    });
    (0, node_test_1.it)('parses swipe by direction and by coordinates', () => {
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([{ swipe: 'up' }]), [
            { kind: 'swipe', direction: 'up' },
        ]);
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([
            { swipe: { from: { x: 100, y: 800 }, to: { x: 100, y: 200 } } },
        ]), [
            {
                kind: 'swipe',
                from: { x: 100, y: 800 },
                to: { x: 100, y: 200 },
            },
        ]);
    });
    (0, node_test_1.it)('parses launchApp empty / string / object', () => {
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([{ launchApp: null }]), [
            { kind: 'launchApp' },
        ]);
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([{ launchApp: 'com.bank.app' }]), [{ kind: 'launchApp', appId: 'com.bank.app' }]);
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([{ launchApp: { clearState: true } }]), [{ kind: 'launchApp', clearState: true }]);
    });
    (0, node_test_1.it)('parses waitFor with timeout', () => {
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([
            { waitFor: { selector: { text: 'Welcome' }, timeoutMs: 30000 } },
        ]), [
            {
                kind: 'waitFor',
                selector: { text: 'Welcome' },
                timeoutMs: 30000,
            },
        ]);
    });
    (0, node_test_1.it)('parses assertVisible / assertNotVisible', () => {
        strict_1.default.deepEqual((0, parser_js_1.parseStructuredSteps)([
            { assertVisible: 'Home' },
            { assertNotVisible: { id: 'spinner' } },
        ]), [
            { kind: 'assertVisible', selector: { text: 'Home' } },
            { kind: 'assertNotVisible', selector: { id: 'spinner' } },
        ]);
    });
    (0, node_test_1.it)('reports the index of the failing step', () => {
        strict_1.default.throws(() => (0, parser_js_1.parseStructuredSteps)([{ tapOn: 'OK' }, { tapOn: 42 }]), /step\[1\]/);
    });
});
//# sourceMappingURL=parser.test.js.map