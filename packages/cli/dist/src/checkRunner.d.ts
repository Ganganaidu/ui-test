import { type SuiteDefinition, type TestDefinition, type RunTarget } from '@usb-ui-test/common';
import { type ResolvedAppConfig } from './appConfig.js';
import { type AppOverrideValidationResult, type UsbUiTestWorkspace } from './workspace.js';
import type { LoadedEnvironmentConfig } from './testLoader.js';
export declare const SUITE_SELECTOR_CONFLICT_ERROR = "Pass either --suite <path> or positional test selectors, not both.";
export interface CheckRunnerOptions {
    envName?: string;
    selectors?: string[];
    suitePath?: string;
    platform?: string;
    appPath?: string;
    cwd?: string;
    requireSelection?: boolean;
}
export interface CheckRunnerResult {
    workspace: UsbUiTestWorkspace;
    environment: LoadedEnvironmentConfig;
    tests: TestDefinition[];
    target: RunTarget;
    suite?: SuiteDefinition;
    resolvedApp: ResolvedAppConfig;
    appOverride?: AppOverrideValidationResult;
}
export declare function runCheck(options: CheckRunnerOptions): Promise<CheckRunnerResult>;
//# sourceMappingURL=checkRunner.d.ts.map