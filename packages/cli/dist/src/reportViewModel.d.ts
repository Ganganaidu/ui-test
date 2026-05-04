import type { RunIndexEntry, RunManifest, TestDefinition, TestResult } from '@usb-ui-test/common';
export interface ReportWorkspaceContext {
    workspaceRoot: string;
    artifactsDir: string;
}
export interface ReportIndexRunRecord extends RunIndexEntry {
    displayName: string;
    displayKind: 'suite' | 'single_test' | 'multi_test' | 'fallback';
    triggeredFrom: 'Suite' | 'Direct';
    selectedTestCount: number;
}
export interface ReportIndexViewModel {
    generatedAt: string;
    summary: {
        totalRuns: number;
        totalSuccessRate: number;
        totalDurationMs: number;
    };
    runs: ReportIndexRunRecord[];
}
export interface ReportManifestSelectedTestRecord extends TestDefinition {
    snapshotYamlText?: string;
}
export interface ReportManifestTestRecord extends TestResult {
    snapshotYamlText?: string;
    deviceLogTailText?: string;
}
export interface ReportRunManifest extends Omit<RunManifest, 'input' | 'tests'> {
    input: Omit<RunManifest['input'], 'tests'> & {
        tests: ReportManifestSelectedTestRecord[];
    };
    tests: ReportManifestTestRecord[];
}
export declare function resolveReportWorkspaceContext(): ReportWorkspaceContext;
export declare function loadReportIndexViewModel(context?: ReportWorkspaceContext): Promise<ReportIndexViewModel>;
export declare function loadRunManifestRecord(runId: string, context?: ReportWorkspaceContext): Promise<RunManifest>;
export declare function loadReportRunManifestViewModel(runId: string, context?: ReportWorkspaceContext): Promise<ReportRunManifest>;
//# sourceMappingURL=reportViewModel.d.ts.map