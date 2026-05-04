import type { TestDefinition, SuiteDefinition, EnvironmentConfig, RuntimeBindings, SecretReference } from '@usb-ui-test/common';
import { CliEnv } from './env.js';
export interface LoadedEnvironmentConfig {
    envName: string;
    envPath?: string;
    config: EnvironmentConfig;
    bindings: RuntimeBindings;
    secretReferences: SecretReference[];
}
export declare function loadEnvironmentConfig(envPath: string | undefined, envName: string, runtimeEnv: CliEnv): Promise<LoadedEnvironmentConfig>;
export declare function loadTest(filePath: string, testsDir: string): Promise<TestDefinition>;
export declare function loadTestSuite(filePath: string, suitesDir: string): Promise<SuiteDefinition>;
export declare function validateTestBindings(test: TestDefinition, envConfig: EnvironmentConfig, options?: {
    environmentResolved?: boolean;
}): void;
//# sourceMappingURL=testLoader.d.ts.map