"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rebuildRunIndex = rebuildRunIndex;
exports.loadRunIndex = loadRunIndex;
exports.formatRunIndexForConsole = formatRunIndexForConsole;
const fsp = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
async function rebuildRunIndex(artifactsDir) {
    await fsp.mkdir(artifactsDir, { recursive: true });
    const entries = await fsp.readdir(artifactsDir, { withFileTypes: true });
    const runs = [];
    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }
        const runId = entry.name;
        const runJsonPath = path.join(artifactsDir, runId, 'run.json');
        let manifest;
        try {
            const raw = await fsp.readFile(runJsonPath, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion !== 2 && parsed.schemaVersion !== 3) {
                continue;
            }
            manifest = parsed;
        }
        catch {
            continue;
        }
        const target = manifest.run.target ?? {
            type: 'direct',
        };
        runs.push({
            runId: manifest.run.runId,
            success: manifest.run.success,
            status: manifest.run.status,
            failurePhase: manifest.run.failurePhase,
            startedAt: manifest.run.startedAt,
            completedAt: manifest.run.completedAt,
            durationMs: manifest.run.durationMs,
            envName: manifest.run.envName,
            platform: manifest.run.platform,
            modelLabel: manifest.run.model.label,
            appLabel: manifest.run.app.label,
            target,
            testCount: manifest.run.counts.tests.total,
            passedCount: manifest.run.counts.tests.passed,
            failedCount: manifest.run.counts.tests.failed,
            stepCount: manifest.run.counts.steps.total,
            firstFailure: manifest.run.firstFailure,
            previewScreenshotPath: manifest.run.firstFailure?.screenshotPath
                ? path.posix.join(runId, manifest.run.firstFailure.screenshotPath)
                : undefined,
            paths: {
                runJson: path.posix.join(runId, manifest.paths.runJson),
                log: path.posix.join(runId, manifest.paths.log),
            },
        });
    }
    runs.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
    const index = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        runs,
    };
    await fsp.writeFile(path.join(artifactsDir, 'runs.json'), JSON.stringify(index, null, 2), 'utf-8');
    return index;
}
async function loadRunIndex(artifactsDir) {
    try {
        const raw = await fsp.readFile(path.join(artifactsDir, 'runs.json'), 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return rebuildRunIndex(artifactsDir);
    }
}
function formatRunIndexForConsole(index) {
    if (index.runs.length === 0) {
        return 'No UsbUiTest reports found.';
    }
    const lines = ['Status  Env       Platform  Tests     Duration  Run ID'];
    for (const run of index.runs) {
        lines.push(`${pad(resolveRunStatusLabel(run), 6)}  ${pad(run.envName, 8)}  ${pad(run.platform, 8)}  ${pad(`${run.passedCount}/${run.testCount}`, 8)}  ${pad(formatDuration(run.durationMs), 8)}  ${run.runId}`);
    }
    return lines.join('\n');
}
function resolveRunStatusLabel(run) {
    if (run.status === 'aborted') {
        return 'ABORT';
    }
    return run.success ? 'PASS' : 'FAIL';
}
function pad(value, width) {
    return value.length >= width ? value : `${value}${' '.repeat(width - value.length)}`;
}
function formatDuration(durationMs) {
    const seconds = Number(durationMs || 0) / 1000;
    return seconds >= 10 ? `${seconds.toFixed(0)}s` : `${seconds.toFixed(1)}s`;
}
//# sourceMappingURL=runIndex.js.map