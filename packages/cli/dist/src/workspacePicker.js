"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSelectionCancelledError = void 0;
exports.promptForWorkspaceSelection = promptForWorkspaceSelection;
exports.formatWorkspaceSelectionList = formatWorkspaceSelectionList;
const promises_1 = require("node:readline/promises");
class WorkspaceSelectionCancelledError extends Error {
    exitCode = 1;
    constructor() {
        super('Workspace selection cancelled.');
        this.name = 'WorkspaceSelectionCancelledError';
    }
}
exports.WorkspaceSelectionCancelledError = WorkspaceSelectionCancelledError;
async function promptForWorkspaceSelection(params) {
    if (!params.io.isTTY) {
        throw new Error('Interactive workspace selection requires a TTY.');
    }
    const rendered = formatWorkspaceSelectionList(params.entries);
    params.io.output.write(`\n${params.heading}\n`);
    params.io.output.write(`${rendered.text}\n`);
    const readline = (0, promises_1.createInterface)({
        input: params.io.input,
        output: params.io.output,
    });
    try {
        for (;;) {
            const answer = (await readline.question('Enter a workspace number (q to cancel): ')).trim();
            if (answer.length === 0 || answer.toLowerCase() === 'q') {
                throw new WorkspaceSelectionCancelledError();
            }
            if (!/^\d+$/.test(answer)) {
                params.io.output.write('Invalid selection. Enter one of the listed numbers, or q to cancel.\n');
                continue;
            }
            const selection = Number.parseInt(answer, 10);
            const matched = rendered.numberedEntries.find((candidate) => candidate.index === selection);
            if (matched) {
                return matched.entry;
            }
            params.io.output.write('Invalid selection. Enter one of the listed numbers, or q to cancel.\n');
        }
    }
    finally {
        readline.close();
    }
}
function formatWorkspaceSelectionList(entries) {
    const lines = [];
    const numberedEntries = [];
    for (const [offset, entry] of entries.entries()) {
        const index = offset + 1;
        numberedEntries.push({ entry, index });
        lines.push(`${index}. ${entry.label}`);
        lines.push(`   ${entry.workspaceRoot}`);
    }
    return {
        text: lines.join('\n'),
        numberedEntries,
    };
}
//# sourceMappingURL=workspacePicker.js.map