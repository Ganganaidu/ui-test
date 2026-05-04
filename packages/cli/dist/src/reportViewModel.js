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
exports.resolveReportWorkspaceContext = resolveReportWorkspaceContext;
exports.loadReportIndexViewModel = loadReportIndexViewModel;
exports.loadRunManifestRecord = loadRunManifestRecord;
exports.loadReportRunManifestViewModel = loadReportRunManifestViewModel;
// View-model loaders for the local report.
//
// Returns objects whose artifact paths stay workspace-relative (NOT rewritten
// to HTTP URLs). The React components in @usb-ui-test/report-web/ui do URL
// rewriting via their own buildArtifactRoute() helper, so the JSON served on
// /api/report/* matches exactly what the components expect.
//
// Type shapes mirror packages/report-web/src/artifacts.ts. Keep them aligned
// if either side changes.
const fsp = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const runIndex_js_1 = require("./runIndex.js");
const MISSING_WORKSPACE_CONFIG_ERROR = 'The UsbUiTest report server is missing workspace configuration. Start it with `usb-ui-test start-server`.';
function resolveReportWorkspaceContext() {
    const workspaceRoot = process.env.USB_UI_TEST_REPORT_WORKSPACE_ROOT;
    const artifactsDir = process.env.USB_UI_TEST_REPORT_ARTIFACTS_DIR;
    if (!workspaceRoot || !artifactsDir) {
        throw new Error(MISSING_WORKSPACE_CONFIG_ERROR);
    }
    return { workspaceRoot, artifactsDir };
}
async function loadReportIndexViewModel(context = resolveReportWorkspaceContext()) {
    const index = await (0, runIndex_js_1.loadRunIndex)(context.artifactsDir);
    const runs = await Promise.all(index.runs.map((run) => enrichRunIndexEntry(run, context)));
    const passedRuns = runs.filter((run) => run.success).length;
    return {
        generatedAt: index.generatedAt,
        summary: {
            totalRuns: runs.length,
            totalSuccessRate: runs.length === 0 ? 0 : (passedRuns / runs.length) * 100,
            totalDurationMs: runs.reduce((total, run) => total + Number(run.durationMs || 0), 0),
        },
        runs,
    };
}
async function loadRunManifestRecord(runId, context = resolveReportWorkspaceContext()) {
    const runJsonPath = path.join(context.artifactsDir, runId, 'run.json');
    const raw = await fsp.readFile(runJsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== 2 && parsed.schemaVersion !== 3) {
        throw new Error(`Unsupported schema version: ${parsed.schemaVersion}`);
    }
    return parsed;
}
async function loadReportRunManifestViewModel(runId, context = resolveReportWorkspaceContext()) {
    return enrichRunManifestRecord(await loadRunManifestRecord(runId, context), context);
}
async function enrichRunManifestRecord(manifest, context) {
    const runId = manifest.run.runId;
    const snapshotCache = new Map();
    const readSnapshotYamlText = async (snapshotYamlPath) => {
        if (!snapshotYamlPath)
            return undefined;
        let cached = snapshotCache.get(snapshotYamlPath);
        if (!cached) {
            cached = readRunArtifactText(context, runId, snapshotYamlPath);
            snapshotCache.set(snapshotYamlPath, cached);
        }
        return cached;
    };
    const readDeviceLogTail = async (deviceLogPath) => {
        if (!deviceLogPath)
            return undefined;
        const content = await readRunArtifactText(context, runId, deviceLogPath);
        if (!content)
            return undefined;
        const lines = content.split('\n');
        const maxLines = 500;
        if (lines.length > maxLines) {
            return `[… ${lines.length - maxLines} lines truncated]\n${lines.slice(-maxLines).join('\n')}`;
        }
        return content;
    };
    return {
        ...manifest,
        input: {
            ...manifest.input,
            tests: await Promise.all(manifest.input.tests.map(async (t) => ({
                ...t,
                snapshotYamlText: await readSnapshotYamlText(t.snapshotYamlPath),
            }))),
        },
        tests: await Promise.all(manifest.tests.map(async (t) => ({
            ...t,
            snapshotYamlText: await readSnapshotYamlText(t.snapshotYamlPath),
            deviceLogTailText: await readDeviceLogTail(t.deviceLogFile),
        }))),
    };
}
async function readRunArtifactText(context, runId, artifactPath) {
    const normalizedPath = normalizeRunArtifactPath(runId, artifactPath);
    if (!normalizedPath)
        return undefined;
    try {
        return await fsp.readFile(path.join(context.artifactsDir, runId, normalizedPath), 'utf-8');
    }
    catch {
        return undefined;
    }
}
function normalizeRunArtifactPath(runId, artifactPath) {
    const normalized = artifactPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.length === 0)
        return undefined;
    if (!normalized.startsWith('artifacts/'))
        return normalized;
    const withoutArtifactsPrefix = normalized.slice('artifacts/'.length);
    if (withoutArtifactsPrefix.startsWith(`${runId}/`)) {
        return withoutArtifactsPrefix.slice(runId.length + 1);
    }
    return undefined;
}
async function enrichRunIndexEntry(run, context) {
    const manifest = await loadRunManifestRecord(run.runId, context).catch(() => null);
    const selectedTests = manifest?.input.tests ?? [];
    return {
        ...run,
        displayName: deriveRunDisplayName(run, manifest),
        displayKind: deriveRunDisplayKind(run, manifest),
        triggeredFrom: run.target?.type === 'suite' ? 'Suite' : 'Direct',
        selectedTestCount: selectedTests.length > 0 ? selectedTests.length : run.testCount,
    };
}
function deriveRunDisplayName(run, manifest) {
    if (run.target?.type === 'suite' && run.target.suiteName) {
        return run.target.suiteName;
    }
    const selectedTests = manifest?.input.tests ?? [];
    if (selectedTests.length === 1) {
        return selectedTests[0]?.name || selectedTests[0]?.relativePath || run.runId;
    }
    if (selectedTests.length > 1) {
        const firstLabel = selectedTests[0]?.name || selectedTests[0]?.relativePath || 'Selected tests';
        return `${firstLabel} +${selectedTests.length - 1} more`;
    }
    return run.runId;
}
function deriveRunDisplayKind(run, manifest) {
    if (run.target?.type === 'suite')
        return 'suite';
    const selectedCount = manifest?.input.tests?.length ?? run.testCount;
    if (selectedCount === 1)
        return 'single_test';
    if (selectedCount > 1)
        return 'multi_test';
    return 'fallback';
}
//# sourceMappingURL=reportViewModel.js.map