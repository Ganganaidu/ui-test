import { type FailurePhase, type FeatureOverrides, type LoggerSink, type ReasoningLevel, type RunManifestAppRecord, type RunStatus, type RunSummary, type RunTarget, type RuntimeBindings, type SuiteDefinition, type TestDefinition, type TestResult } from '@usb-ui-test/common';
import type { TestExecutionResult } from '@usb-ui-test/goal-executor';
import type { LoadedEnvironmentConfig } from './testLoader.js';
export declare class ReportWriter {
    private static readonly _FAILURE_PLACEHOLDER_IMAGE;
    private readonly _runDir;
    private readonly _envName;
    private readonly _platform;
    private readonly _runId;
    private readonly _bindings;
    private readonly _runnerLogPath;
    private _inputEnvironment;
    private _inputSuite?;
    private _inputTests;
    private readonly _testSnapshots;
    private _cliContext;
    private _runTarget;
    private _modelContext;
    private _appContext;
    private _runContextJsonPath?;
    constructor(params: {
        runDir: string;
        envName: string;
        platform: string;
        runId: string;
        bindings: RuntimeBindings;
    });
    init(): Promise<void>;
    createLoggerSink(): LoggerSink;
    appendLogLine(line: string): void;
    appendRawBlock(block: string): void;
    setRunContext(params: {
        cli: {
            command: string;
            selectors: string[];
            debug: boolean;
            [key: string]: unknown;
        };
        model: {
            provider: string;
            modelName: string;
            label: string;
        };
        app: RunManifestAppRecord;
        target?: RunTarget;
    }): void;
    writeRunInputs(params: {
        workspaceRoot: string;
        environment: LoadedEnvironmentConfig;
        tests: TestDefinition[];
        suite?: SuiteDefinition;
        effectiveGoals: Map<string, string>;
        target: RunTarget;
        cli: {
            command: string;
            selectors: string[];
            debug: boolean;
            [key: string]: unknown;
        };
        model: {
            provider: string;
            modelName: string;
            label: string;
        };
        reasoning?: ReasoningLevel;
        features?: FeatureOverrides;
        app: RunManifestAppRecord;
    }): Promise<void>;
    writeTestRecord(test: TestDefinition, result: TestExecutionResult, bindings: RuntimeBindings): Promise<TestResult>;
    finalize(params: {
        startedAt: string;
        completedAt: string;
        tests: TestResult[];
        successOverride?: boolean;
        statusOverride?: RunStatus;
        failurePhase?: FailurePhase;
        diagnosticsSummary?: string;
    }): Promise<RunSummary>;
    writeTestFailureRecord(params: {
        test: TestDefinition;
        bindings: RuntimeBindings;
        message: string;
        platform: string;
        startedAt: string;
        completedAt: string;
    }): Promise<TestResult>;
    private _buildRunManifest;
    private _toRunManifestTest;
    private _copyRecordingArtifact;
    private _copyLogArtifact;
    private _formatError;
}
//# sourceMappingURL=reportWriter.d.ts.map