import { RunIndexEntry, TestDefinition, TestResult, RunManifest } from '@usb-ui-test/common';

interface ReportIndexRunRecord extends RunIndexEntry {
    displayName: string;
    displayKind: 'suite' | 'single_test' | 'multi_test' | 'fallback';
    triggeredFrom: 'Suite' | 'Direct';
    selectedTestCount: number;
}
interface ReportIndexViewModel {
    generatedAt: string;
    summary: {
        totalRuns: number;
        totalSuccessRate: number;
        totalDurationMs: number;
    };
    runs: ReportIndexRunRecord[];
}
interface ReportManifestSelectedTestRecord extends TestDefinition {
    snapshotYamlText?: string;
}
interface ReportManifestTestRecord extends TestResult {
    snapshotYamlText?: string;
    deviceLogTailText?: string;
}
interface ReportRunManifest extends Omit<RunManifest, 'input' | 'tests'> {
    input: Omit<RunManifest['input'], 'tests'> & {
        tests: ReportManifestSelectedTestRecord[];
    };
    tests: ReportManifestTestRecord[];
}

export type { ReportIndexViewModel as R, ReportRunManifest as a, ReportManifestSelectedTestRecord as b, ReportManifestTestRecord as c, ReportIndexRunRecord as d };
