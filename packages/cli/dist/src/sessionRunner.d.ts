import { DeviceInfo, type DeviceInventoryDiagnostic, type FeatureOverrides, type ModelDefaults, type RuntimeBindings } from '@usb-ui-test/common';
import { DeviceNode } from '@usb-ui-test/device-node';
import { TestExecutor, AIAgent } from '@usb-ui-test/goal-executor';
import type { TestExecutionResult } from '@usb-ui-test/goal-executor';
import { type StructuredStep } from '@usb-ui-test/local-executor';
import type { ResolvedAppConfig } from './appConfig.js';
import { CliFilePathUtil } from './filePathUtil.js';
import { type DeviceSelectionIO } from './deviceInventoryPresenter.js';
import { TerminalRenderer } from './terminalRenderer.js';
type GoalRunnerDeviceNode = Pick<DeviceNode, 'init' | 'detectInventory' | 'startTarget' | 'setUpDevice' | 'cleanup' | 'installAndroidApp' | 'installIOSApp'>;
type GoalRunnerDevice = Awaited<ReturnType<DeviceNode['setUpDevice']>>;
type GoalRunnerRenderer = Pick<TerminalRenderer, 'onProgress' | 'printSummary' | 'destroy'>;
type GoalRunnerExecutor = Pick<TestExecutor, 'abort' | 'executeGoal'>;
export interface TestSessionConfig {
    goal: string;
    /**
     * Execution mode for this session. When 'deterministic' the session uses
     * @usb-ui-test/local-executor with the structuredSteps below — no AI
     * provider is contacted. When omitted/'ai' the existing AI-driven flow
     * runs. Set by testRunner from TestDefinition.mode.
     */
    mode?: 'ai' | 'deterministic';
    /** Parsed structured commands when mode === 'deterministic'. */
    structuredSteps?: StructuredStep[];
    apiKeys: Record<string, string>;
    defaults: ModelDefaults;
    features?: FeatureOverrides;
    maxIterations?: number;
    debug?: boolean;
    platform?: string;
    appOverridePath?: string;
    app?: ResolvedAppConfig;
    runtimeBindings?: RuntimeBindings;
    abortSignal?: AbortSignal;
    recording?: {
        runId: string;
        testId: string;
        outputFilePath?: string;
        keepPartialOnFailure?: boolean;
    };
    deviceLog?: {
        runId: string;
        testId: string;
        keepPartialOnFailure?: boolean;
    };
}
export interface GoalSessionConfig {
    platform?: string;
    appOverridePath?: string;
    app?: ResolvedAppConfig;
}
export interface TestSessionDeps {
    createFilePathUtil(): CliFilePathUtil;
    getDeviceNode(): GoalRunnerDeviceNode;
    createSelectionIO(): DeviceSelectionIO;
    createAiAgent(params: ConstructorParameters<typeof AIAgent>[0]): AIAgent;
    createExecutor(params: ConstructorParameters<typeof TestExecutor>[0]): GoalRunnerExecutor;
    createRenderer(): GoalRunnerRenderer;
}
export interface TestSession {
    deviceNode: GoalRunnerDeviceNode;
    device: GoalRunnerDevice;
    deviceInfo: DeviceInfo;
    platform: string;
    app?: ResolvedAppConfig;
    launchSummary?: string;
    cleanup(): Promise<void>;
}
export declare class DevicePreparationError extends Error {
    readonly diagnostics: DeviceInventoryDiagnostic[];
    constructor(message: string, diagnostics?: DeviceInventoryDiagnostic[]);
}
export declare function isDevicePreparationError(error: unknown): error is DevicePreparationError;
export declare const testSessionDeps: TestSessionDeps;
export declare function prepareTestSession(config: GoalSessionConfig, dependencies?: TestSessionDeps): Promise<TestSession>;
export declare function executeTestOnSession(session: TestSession, config: TestSessionConfig, dependencies?: TestSessionDeps): Promise<TestExecutionResult>;
/**
 * Top-level orchestrator for running a goal from the CLI.
 *
 */
export declare function runGoal(config: TestSessionConfig, dependencies?: TestSessionDeps): Promise<TestExecutionResult>;
export {};
//# sourceMappingURL=sessionRunner.d.ts.map