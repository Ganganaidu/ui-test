import type { Writable } from 'node:stream';
import { runHostPreflight, type HostPreflightDependencies, type HostPreflightResult } from './hostPreflight.js';
export interface DoctorRunnerOptions {
    platform?: string;
    output?: Writable;
}
export interface DoctorRunnerDependencies {
    runHostPreflight: typeof runHostPreflight;
    hostPreflightDependencies: Pick<HostPreflightDependencies, 'getPlatform'>;
}
export interface DoctorRunnerResult {
    success: boolean;
    report: string;
    preflight: HostPreflightResult;
}
export declare const doctorRunnerDependencies: DoctorRunnerDependencies;
export declare function runDoctorCommand(options: DoctorRunnerOptions, dependencies?: DoctorRunnerDependencies): Promise<DoctorRunnerResult>;
//# sourceMappingURL=doctorRunner.d.ts.map