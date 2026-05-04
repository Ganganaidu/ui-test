"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const terminalRenderer_js_1 = require("./terminalRenderer.js");
(0, node_test_1.default)('TerminalRenderer prints provider runtime failures as errors and failed summaries', () => {
    const renderer = new terminalRenderer_js_1.TerminalRenderer();
    const terminalFailureMessage = 'AI provider error (openai/gpt-5.4-mini, HTTP 401): Unauthorized';
    const printedLines = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        printedLines.push(args.join(' '));
    };
    try {
        renderer.onProgress({
            type: 'error',
            iteration: 1,
            totalIterations: 50,
            message: terminalFailureMessage,
        });
        renderer.printSummary({
            success: false,
            status: 'failure',
            message: terminalFailureMessage,
            terminalFailure: {
                kind: 'provider',
                provider: 'openai',
                modelName: 'gpt-5.4-mini',
                statusCode: 401,
                message: terminalFailureMessage,
            },
            platform: 'android',
            startedAt: '2026-03-30T10:00:00.000Z',
            completedAt: '2026-03-30T10:00:01.000Z',
            steps: [],
            totalIterations: 1,
        });
    }
    finally {
        console.log = originalConsoleLog;
        renderer.destroy();
    }
    const output = printedLines.join('\n');
    strict_1.default.match(output, /AI provider error \(openai\/gpt-5.4-mini, HTTP 401\): Unauthorized/);
    strict_1.default.match(output, /Goal failed/);
    strict_1.default.doesNotMatch(output, /Goal aborted/);
});
//# sourceMappingURL=terminalRenderer.test.js.map