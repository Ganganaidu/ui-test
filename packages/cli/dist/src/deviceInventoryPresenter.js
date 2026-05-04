"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptForDeviceSelection = promptForDeviceSelection;
exports.formatDeviceSelectionList = formatDeviceSelectionList;
exports.printInventorySummary = printInventorySummary;
exports.formatDiagnosticsForOutput = formatDiagnosticsForOutput;
exports.printDiagnosticsFailure = printDiagnosticsFailure;
const promises_1 = require("node:readline/promises");
async function promptForDeviceSelection(params) {
    const rendered = formatDeviceSelectionList(params.entries, params.selectableEntries ?? params.entries);
    params.io.output.write(`\n${params.heading}\n`);
    params.io.output.write(`${rendered.text}\n`);
    if (params.io.isTTY) {
        return await interactiveSelection(rendered, params.io);
    }
    return await pipedSelection(rendered, params.io);
}
async function interactiveSelection(rendered, io) {
    const readline = (0, promises_1.createInterface)({
        input: io.input,
        output: io.output,
    });
    try {
        for (;;) {
            const answer = await readline.question('Enter a device number: ');
            const selection = Number.parseInt(answer.trim(), 10);
            const matched = rendered.numberedEntries.find((candidate) => candidate.index === selection);
            if (matched) {
                return matched.entry;
            }
            io.output.write('Invalid selection. Enter one of the listed numbers.\n');
        }
    }
    finally {
        readline.close();
    }
}
async function pipedSelection(rendered, io) {
    const line = await readFirstLine(io.input);
    if (line === null) {
        const validNums = rendered.numberedEntries.map((e) => e.index).join(', ');
        throw new Error(`Multiple devices available (${validNums}). ` +
            'Pipe a device number to select one, for example: echo "1" | usb-ui-test test ...');
    }
    const selection = Number.parseInt(line.trim(), 10);
    const matched = rendered.numberedEntries.find((candidate) => candidate.index === selection);
    if (matched) {
        return matched.entry;
    }
    const validNums = rendered.numberedEntries.map((e) => e.index).join(', ');
    throw new Error(`Invalid device number "${line.trim()}". Valid numbers: ${validNums}`);
}
function readFirstLine(stream) {
    return new Promise((resolve, reject) => {
        const rs = stream;
        if (rs.readableEnded || rs.readable === false) {
            return resolve(null);
        }
        let buffer = '';
        let settled = false;
        const cleanup = () => {
            stream.removeListener('data', onData);
            stream.removeListener('end', onEnd);
            stream.removeListener('error', onError);
        };
        const onData = (chunk) => {
            if (settled) {
                return;
            }
            buffer += String(chunk);
            const newlineIndex = buffer.indexOf('\n');
            if (newlineIndex !== -1) {
                settled = true;
                cleanup();
                resolve(buffer.substring(0, newlineIndex));
            }
        };
        const onEnd = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(buffer.trim().length > 0 ? buffer.trim() : null);
        };
        const onError = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        };
        stream.on('data', onData);
        stream.on('end', onEnd);
        stream.on('error', onError);
    });
}
function formatDeviceSelectionList(entries, selectableEntries = entries) {
    const selectableIds = new Set(selectableEntries.map((entry) => entry.selectionId));
    const sections = buildEntrySections(entries);
    const lines = [];
    const numberedEntries = [];
    let index = 1;
    for (const section of sections) {
        if (lines.length > 0) {
            lines.push('');
        }
        lines.push(section.title);
        for (const entry of section.entries) {
            if (selectableIds.has(entry.selectionId)) {
                numberedEntries.push({ entry, index });
                lines.push(`  ${index}. ${entry.displayName} (${formatEntryState(entry)})`);
                index += 1;
            }
            else {
                lines.push(`  - ${entry.displayName} (${formatEntryState(entry)})`);
            }
        }
    }
    return {
        text: lines.join('\n'),
        numberedEntries,
    };
}
function printInventorySummary(params) {
    const rendered = formatDeviceSelectionList(params.entries, params.selectableEntries);
    if (!rendered.text) {
        return;
    }
    params.output.write(`\n${params.heading}\n`);
    params.output.write(`${rendered.text}\n`);
}
function formatDiagnosticsForOutput(diagnostics) {
    return diagnostics
        .map((diagnostic) => {
        const transcripts = diagnostic.transcripts.map(formatTranscriptBlock);
        if (transcripts.length === 0) {
            return diagnostic.summary;
        }
        return [diagnostic.summary, ...transcripts].join('\n\n');
    })
        .join('\n\n');
}
function printDiagnosticsFailure(params) {
    if (params.diagnostics.length === 0) {
        return;
    }
    const renderedDiagnostics = formatDiagnosticsForOutput(params.diagnostics);
    params.output.write(`\n${params.heading}\n`);
    params.output.write(`${renderedDiagnostics}\n`);
}
function buildEntrySections(entries) {
    const readyEntries = entries.filter((entry) => entry.runnable);
    const startableEntries = entries.filter((entry) => !entry.runnable && entry.startable);
    const unavailableEntries = entries.filter((entry) => !entry.runnable && !entry.startable);
    const sections = [];
    if (readyEntries.length > 0) {
        sections.push({ title: 'Ready Targets', entries: readyEntries });
    }
    if (startableEntries.length > 0) {
        sections.push({ title: 'Available to Start', entries: startableEntries });
    }
    if (unavailableEntries.length > 0) {
        sections.push({ title: 'Unavailable Targets', entries: unavailableEntries });
    }
    return sections;
}
function formatEntryState(entry) {
    if (entry.stateDetail && entry.stateDetail.trim().length > 0) {
        return `${entry.state}: ${entry.stateDetail.trim()}`;
    }
    return entry.state;
}
function formatTranscriptBlock(transcript) {
    const lines = [`Command: ${transcript.command}`];
    lines.push('stdout:');
    lines.push(transcript.stdout.length > 0 ? transcript.stdout : '(empty)');
    lines.push('stderr:');
    lines.push(transcript.stderr.length > 0 ? transcript.stderr : '(empty)');
    lines.push(`exitCode: ${transcript.exitCode ?? 'null'}`);
    return lines.join('\n');
}
//# sourceMappingURL=deviceInventoryPresenter.js.map