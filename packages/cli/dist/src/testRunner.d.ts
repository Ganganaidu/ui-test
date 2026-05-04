import { type DeviceInfo, type DeviceInventoryDiagnostic, type FeatureOverrides, type ModelDefaults, type TestResult } from '@usb-ui-test/common';
import { executeTestOnSession, prepareTestSession } from './sessionRunner.js';
import type { ExecutionStatus } from '@usb-ui-test/goal-executor';
import { runCheck, type CheckRunnerOptions } from './checkRunner.js';
import { runHostPreflight } from './hostPreflight.js';
import { resolveWorkspace } from './workspace.js';
export interface TestRunnerOptions extends CheckRunnerOptions {
    apiKeys: Record<string, string>;
    defaults: ModelDefaults;
    features?: FeatureOverrides;
    maxIterations?: number;
    debug?: boolean;
    invokedCommand?: 'test' | 'suite';
}
export interface TestRunnerResult {
    success: boolean;
    status: ExecutionStatus;
    runId: string;
    runDir: string;
    runIndexPath: string;
    testResults: TestResult[];
}
export type PreExecutionFailurePhase = 'validation' | 'setup';
export declare class PreExecutionFailureError extends Error {
    readonly phase: PreExecutionFailurePhase;
    readonly diagnostics: DeviceInventoryDiagnostic[];
    readonly exitCode: number;
    constructor(params: {
        phase: PreExecutionFailurePhase;
        message: string;
        diagnostics?: DeviceInventoryDiagnostic[];
        exitCode?: number;
    });
}
export declare const testRunnerDependencies: {
    prepareTestSession: typeof prepareTestSession;
    executeTestOnSession: typeof executeTestOnSession;
    runCheck: typeof runCheck;
    runHostPreflight: typeof runHostPreflight;
    resolveWorkspace: typeof resolveWorkspace;
    addSigintListener(listener: () => void): () => void;
    exitProcess(code: number): never;
    /**
     * Returns true when at least one Android device or emulator is already
     * reported as connected by `adb devices`. Used by the host preflight to
     * downgrade the `emulator` binary check from blocking to a warning —
     * the binary is only needed to *boot* an AVD, not to use an attached device.
     */
    hasConnectedAdbDevice(): Promise<boolean>;
};
export declare function runTests(options: TestRunnerOptions): Promise<TestRunnerResult>;
export declare function selectExecutionPlatform(devices: Array<Pick<DeviceInfo, 'getPlatform'>>, preferredPlatform?: string): string;
//# sourceMappingURL=testRunner.d.ts.map