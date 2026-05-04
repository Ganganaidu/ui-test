"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const env_js_1 = require("./env.js");
(0, node_test_1.default)('parseModel requires an explicit model value', () => {
    strict_1.default.throws(() => (0, env_js_1.parseModel)(undefined), /--model is required\. Use provider\/model, for example google\/gemini-3-flash-preview\. Supported providers: openai, google, anthropic\./);
});
(0, node_test_1.default)('parseModel trims outer whitespace before validation', () => {
    strict_1.default.deepEqual((0, env_js_1.parseModel)('  google/gemini-3-flash-preview  '), {
        provider: 'google',
        modelName: 'gemini-3-flash-preview',
    });
});
(0, node_test_1.default)('parseModel rejects malformed values without a slash', () => {
    strict_1.default.throws(() => (0, env_js_1.parseModel)('openai'), /Invalid model format: "openai"\. Expected provider\/model with non-empty provider and model name\. Supported providers: openai, google, anthropic\./);
});
(0, node_test_1.default)('parseModel rejects an empty provider segment', () => {
    strict_1.default.throws(() => (0, env_js_1.parseModel)('/gpt-5.4-mini'), /Invalid model format: "\/gpt-5.4-mini"\. Expected provider\/model with non-empty provider and model name\. Supported providers: openai, google, anthropic\./);
});
(0, node_test_1.default)('parseModel rejects an empty model segment', () => {
    strict_1.default.throws(() => (0, env_js_1.parseModel)('openai/'), /Invalid model format: "openai\/"\. Expected provider\/model with non-empty provider and model name\. Supported providers: openai, google, anthropic\./);
});
(0, node_test_1.default)('parseModel rejects unsupported providers', () => {
    strict_1.default.throws(() => (0, env_js_1.parseModel)('bedrock/claude'), /Unsupported AI provider: "bedrock"\. Supported providers: openai, google, anthropic\./);
});
(0, node_test_1.default)('parseModel prefixes errors with the provided label for context', () => {
    // Trailing whitespace after the slash collapses under the outer trim, so
    // the echoed value is "openai/" (empty model half) and the label prefix
    // points the user at the exact config entry that tripped validation.
    strict_1.default.throws(() => (0, env_js_1.parseModel)('openai/ ', 'features.planner.model'), /features\.planner\.model has invalid model format: "openai\/"\./);
    strict_1.default.throws(() => (0, env_js_1.parseModel)('bedrock/claude', 'features.planner.model'), /features\.planner\.model has unsupported AI provider: "bedrock"\./);
    // Sanity: omitting the label keeps the pre-existing CLI-style error text
    // that other tests (and --model users) depend on.
    strict_1.default.throws(() => (0, env_js_1.parseModel)(undefined), /--model is required\./);
});
(0, node_test_1.default)('parseReasoningLevel returns undefined when unset', () => {
    strict_1.default.equal((0, env_js_1.parseReasoningLevel)(undefined, 'reasoning'), undefined);
    strict_1.default.equal((0, env_js_1.parseReasoningLevel)(null, 'reasoning'), undefined);
    strict_1.default.equal((0, env_js_1.parseReasoningLevel)('', 'reasoning'), undefined);
});
(0, node_test_1.default)('parseReasoningLevel accepts minimal, low, medium, high', () => {
    for (const value of ['minimal', 'low', 'medium', 'high']) {
        strict_1.default.equal((0, env_js_1.parseReasoningLevel)(value, 'reasoning'), value);
    }
});
(0, node_test_1.default)('parseReasoningLevel trims surrounding whitespace', () => {
    strict_1.default.equal((0, env_js_1.parseReasoningLevel)('  high  ', 'reasoning'), 'high');
});
(0, node_test_1.default)('parseReasoningLevel rejects non-string values with a labeled error', () => {
    strict_1.default.throws(() => (0, env_js_1.parseReasoningLevel)(42, 'config.yaml reasoning'), /config\.yaml reasoning must be a string\. Allowed values: minimal, low, medium, high\./);
});
(0, node_test_1.default)('parseReasoningLevel rejects unknown values with a labeled error', () => {
    strict_1.default.throws(() => (0, env_js_1.parseReasoningLevel)('extreme', 'config.yaml reasoning'), /config\.yaml reasoning has invalid value "extreme"\. Allowed values: minimal, low, medium, high\./);
});
//# sourceMappingURL=env.test.js.map