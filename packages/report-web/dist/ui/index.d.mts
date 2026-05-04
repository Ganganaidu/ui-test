import * as react_jsx_runtime from 'react/jsx-runtime';
import { R as ReportIndexViewModel, a as ReportRunManifest, b as ReportManifestSelectedTestRecord, c as ReportManifestTestRecord } from '../artifacts-B5l10l25.mjs';
export { d as ReportIndexRunRecord } from '../artifacts-B5l10l25.mjs';
import { ReactNode } from 'react';
import { AgentAction } from '@usb-ui-test/common';

type NavigateFn$1 = (href: string) => void;
declare function RunIndexView({ index, navigate, }: {
    index: ReportIndexViewModel;
    navigate?: NavigateFn$1;
}): react_jsx_runtime.JSX.Element;

type NavigateFn = (href: string) => void;
declare function RunDetailView({ manifest: raw, navigate, initialTestId, backHref, }: {
    manifest: ReportRunManifest;
    navigate?: NavigateFn;
    initialTestId?: string;
    backHref?: string;
}): react_jsx_runtime.JSX.Element;

type StatusPillStatus = 'success' | 'failure' | 'error' | 'aborted' | 'not_executed';
declare function StatusPill({ status }: {
    status: StatusPillStatus;
}): react_jsx_runtime.JSX.Element;

declare function formatLongDuration(durationMs: number | undefined): string;
declare function formatStepDuration(durationMs: number | undefined): string;
declare function successRateTone(rate: number): 'success' | 'warning' | 'danger';
type SummaryTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
declare function summaryIconStyle(tone: SummaryTone): string;
declare function statusPillLabel(status: 'success' | 'failure' | 'error' | 'aborted' | 'not_executed'): string;

declare function SummaryCard({ label, value, tone, iconSvg, }: {
    label: string;
    value: string;
    tone: SummaryTone;
    iconSvg: string;
}): react_jsx_runtime.JSX.Element;

declare function TintedPngIcon({ src }: {
    src: string;
}): react_jsx_runtime.JSX.Element;

declare function DetailSectionCard({ title, subtitle, content, action, cardClass, }: {
    title: string;
    subtitle: string;
    content: ReactNode;
    action?: ReactNode;
    cardClass?: string;
}): react_jsx_runtime.JSX.Element;

declare function StepButton({ testId, step, index, }: {
    testId: string;
    step: AgentAction;
    index: number;
}): react_jsx_runtime.JSX.Element;

declare function VideoPanel({ testId, recordingFile, initialVideoOffsetMs, initialScreenshotFile, }: {
    testId: string;
    recordingFile: string | undefined;
    initialVideoOffsetMs: number | undefined;
    initialScreenshotFile?: string | undefined;
}): react_jsx_runtime.JSX.Element;

declare function DeviceLogPanel({ logText, recordingStartedAt, deviceLogFileUrl, }: {
    logText: string;
    recordingStartedAt: string | undefined;
    deviceLogFileUrl: string;
}): react_jsx_runtime.JSX.Element;

declare function RunContextSummary({ manifest }: {
    manifest: ReportRunManifest;
}): react_jsx_runtime.JSX.Element;

type TestOutcomeStatus = 'success' | 'failure' | 'error' | 'aborted' | 'not_executed';
interface ReportTestListItem {
    input: ReportManifestSelectedTestRecord;
    executed?: ReportManifestTestRecord;
    status: TestOutcomeStatus;
    durationLabel: string;
}
interface OutcomeSummary {
    total: number;
    success: number;
    aborted: number;
    failure: number;
    error: number;
    notExecuted: number;
}
declare function toReportViewModel(manifest: ReportRunManifest): ReportRunManifest;
declare function buildTestListItems(manifest: ReportRunManifest): ReportTestListItem[];
declare function summarizeTestItems(items: ReportTestListItem[]): OutcomeSummary;
declare function classifyTestStatus(test: ReportManifestTestRecord): TestOutcomeStatus;
declare function deriveReportTitle(manifest: ReportRunManifest): string;
declare function formatRelativeTime(timestamp: string): string;
declare function formatVideoTimestamp(videoOffsetMs: number | undefined): string;
declare function statusLabelLong(status: TestOutcomeStatus): string;

declare function SegmentSummary({ summary }: {
    summary: OutcomeSummary;
}): react_jsx_runtime.JSX.Element;

declare function TestDetailSection({ item, visible, parentLabel, manifest, }: {
    item: ReportTestListItem;
    visible: boolean;
    parentLabel?: string;
    manifest?: ReportRunManifest;
}): react_jsx_runtime.JSX.Element;

declare function buildRunRoute(runId: string): string;
declare function buildArtifactRoute(relativePath: string): string;

interface ParsedLogLine {
    text: string;
    timestamp: string | undefined;
    level: 'error' | 'warn' | 'info';
}
declare function parseLogTimestamp(line: string, referenceDate?: string): string | undefined;
declare function parseLogLevel(line: string): 'error' | 'warn' | 'info';
declare function parseDeviceLogLines(logText: string, recordingStartedAt?: string): ParsedLogLine[];

type ReportPayloadTest = {
    testId: string;
    steps: ReportPayloadStep[];
    recordingFile?: string | null;
};
type ReportPayloadStep = {
    videoOffsetMs?: number | null;
    screenshotFile?: string | null;
};
type ReportPayload = {
    tests: ReportPayloadTest[];
};
declare function initRunDetailController(next: ReportPayload): () => void;
declare function switchTab(button: HTMLElement): void;
declare function clearTestSelection(): void;
declare function selectTest(testId: string): void;
declare function handlePrimaryBack(event: Event): boolean;
declare function selectStep(testId: string, stepIndex: number): void;
declare function handleLogFilter(chip: HTMLElement): void;

export { DetailSectionCard, DeviceLogPanel, type OutcomeSummary, type ParsedLogLine, ReportIndexViewModel, ReportManifestSelectedTestRecord, ReportManifestTestRecord, ReportRunManifest, type ReportTestListItem, RunContextSummary, RunDetailView, RunIndexView, SegmentSummary, StatusPill, StepButton, SummaryCard, type SummaryTone, TestDetailSection, type TestOutcomeStatus, TintedPngIcon, VideoPanel, buildArtifactRoute, buildRunRoute, buildTestListItems, classifyTestStatus, clearTestSelection, deriveReportTitle, formatLongDuration, formatRelativeTime, formatStepDuration, formatVideoTimestamp, handleLogFilter, handlePrimaryBack, initRunDetailController, parseDeviceLogLines, parseLogLevel, parseLogTimestamp, selectStep, selectTest, statusLabelLong, statusPillLabel, successRateTone, summarizeTestItems, summaryIconStyle, switchTab, toReportViewModel };
