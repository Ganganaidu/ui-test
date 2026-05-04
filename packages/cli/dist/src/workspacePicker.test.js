"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const workspacePicker_js_1 = require("./workspacePicker.js");
(0, node_test_1.default)('promptForWorkspaceSelection reprompts until a valid workspace number is entered', async () => {
    const input = new node_stream_1.PassThrough();
    const output = new node_stream_1.PassThrough();
    let outputText = '';
    output.on('data', (chunk) => {
        outputText += String(chunk);
    });
    input.write('9\n');
    setImmediate(() => {
        input.end('2\n');
    });
    const selected = await (0, workspacePicker_js_1.promptForWorkspaceSelection)({
        heading: 'Select a workspace',
        entries: [
            {
                label: 'alpha/mobile-app',
                workspaceRoot: '/tmp/alpha-mobile-app',
            },
            {
                label: 'bravo/mobile-app',
                workspaceRoot: '/tmp/bravo-mobile-app',
            },
        ],
        io: {
            input,
            output,
            isTTY: true,
        },
    });
    strict_1.default.equal(selected.label, 'bravo/mobile-app');
    strict_1.default.match(outputText, /Invalid selection/);
});
(0, node_test_1.default)('promptForWorkspaceSelection rejects partially numeric answers and reprompts', async () => {
    const input = new node_stream_1.PassThrough();
    const output = new node_stream_1.PassThrough();
    let outputText = '';
    output.on('data', (chunk) => {
        outputText += String(chunk);
    });
    input.write('1foo\n');
    setImmediate(() => {
        input.end('1\n');
    });
    const selected = await (0, workspacePicker_js_1.promptForWorkspaceSelection)({
        heading: 'Select a workspace',
        entries: [
            {
                label: 'alpha/mobile-app',
                workspaceRoot: '/tmp/alpha-mobile-app',
            },
        ],
        io: {
            input,
            output,
            isTTY: true,
        },
    });
    strict_1.default.equal(selected.label, 'alpha/mobile-app');
    strict_1.default.match(outputText, /Invalid selection/);
});
(0, node_test_1.default)('promptForWorkspaceSelection cancels on q and empty input', async () => {
    await strict_1.default.rejects(() => (0, workspacePicker_js_1.promptForWorkspaceSelection)({
        heading: 'Select a workspace',
        entries: [
            {
                label: 'alpha/mobile-app',
                workspaceRoot: '/tmp/alpha-mobile-app',
            },
        ],
        io: {
            input: node_stream_1.Readable.from(['q\n']),
            output: new node_stream_1.PassThrough(),
            isTTY: true,
        },
    }), workspacePicker_js_1.WorkspaceSelectionCancelledError);
    await strict_1.default.rejects(() => (0, workspacePicker_js_1.promptForWorkspaceSelection)({
        heading: 'Select a workspace',
        entries: [
            {
                label: 'alpha/mobile-app',
                workspaceRoot: '/tmp/alpha-mobile-app',
            },
        ],
        io: {
            input: node_stream_1.Readable.from(['\n']),
            output: new node_stream_1.PassThrough(),
            isTTY: true,
        },
    }), workspacePicker_js_1.WorkspaceSelectionCancelledError);
});
(0, node_test_1.default)('promptForWorkspaceSelection fails with the exact non-TTY message', async () => {
    await strict_1.default.rejects(() => (0, workspacePicker_js_1.promptForWorkspaceSelection)({
        heading: 'Select a workspace',
        entries: [
            {
                label: 'alpha/mobile-app',
                workspaceRoot: '/tmp/alpha-mobile-app',
            },
        ],
        io: {
            input: new node_stream_1.PassThrough(),
            output: new node_stream_1.PassThrough(),
            isTTY: false,
        },
    }), (error) => {
        strict_1.default.ok(error instanceof Error);
        strict_1.default.equal(error.message, 'Interactive workspace selection requires a TTY.');
        return true;
    });
});
(0, node_test_1.default)('formatWorkspaceSelectionList renders labels and full paths', () => {
    const rendered = (0, workspacePicker_js_1.formatWorkspaceSelectionList)([
        {
            label: 'alpha/mobile-app',
            workspaceRoot: '/tmp/alpha-mobile-app',
        },
        {
            label: 'bravo/mobile-app',
            workspaceRoot: '/tmp/bravo-mobile-app',
        },
    ]);
    strict_1.default.match(rendered.text, /1\. alpha\/mobile-app/);
    strict_1.default.match(rendered.text, /\/tmp\/alpha-mobile-app/);
    strict_1.default.match(rendered.text, /2\. bravo\/mobile-app/);
    strict_1.default.match(rendered.text, /\/tmp\/bravo-mobile-app/);
});
//# sourceMappingURL=workspacePicker.test.js.map