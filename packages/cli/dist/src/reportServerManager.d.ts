import { type ChildProcess } from 'node:child_process';
import type { ReportServerState } from '@usb-ui-test/common';
import type { UsbUiTestWorkspace } from './workspace.js';
export interface StartReportServerOptions {
    workspace: UsbUiTestWorkspace;
    requestedPort?: number;
    dev?: boolean;
}
export interface ReportServerSession {
    state: ReportServerState;
    url: string;
    reused: boolean;
}
export interface WorkspaceReportServerStatus {
    running: boolean;
    healthy: boolean;
    staleStateCleared: boolean;
    livePid?: number;
    state?: ReportServerState;
}
export interface StopWorkspaceReportServerResult {
    stopped: boolean;
    staleStateCleared: boolean;
    state?: ReportServerState;
}
export declare const reportServerManagerDependencies: {
    healthProbeTimeoutMs: number;
    spawnProcess(command: string, args: string[], options: {
        cwd: string;
        detached?: boolean;
        env?: NodeJS.ProcessEnv;
        stdio?: "ignore";
    }): ChildProcess;
    fetchJson(url: string, signal?: AbortSignal): Promise<{
        status: number;
        body: unknown;
    }>;
    openBrowser(url: string): Promise<void>;
    sleep(ms: number): Promise<void>;
    killProcess(pid: number, signal: NodeJS.Signals): void;
    isProcessAlive(pid: number): boolean;
};
export declare function startOrReuseWorkspaceReportServer(options: StartReportServerOptions): Promise<ReportServerSession>;
export declare function resolveHealthyWorkspaceReportServer(workspace: UsbUiTestWorkspace): Promise<ReportServerState | undefined>;
export declare function getWorkspaceReportServerStatus(workspace: UsbUiTestWorkspace): Promise<WorkspaceReportServerStatus>;
export declare function stopWorkspaceReportServer(workspace: UsbUiTestWorkspace): Promise<StopWorkspaceReportServerResult>;
export declare function openReportUrl(url: string): Promise<void>;
export declare function buildWorkspaceReportUrl(serverUrl: string): string;
export declare function buildRunReportUrl(serverUrl: string, runId: string): string;
export declare function readWorkspaceReportServerState(workspace: UsbUiTestWorkspace): Promise<ReportServerState | undefined>;
export declare function writeWorkspaceReportServerState(workspace: UsbUiTestWorkspace, state: ReportServerState): Promise<void>;
export declare function clearWorkspaceReportServerState(workspace: UsbUiTestWorkspace): Promise<void>;
export declare function getWorkspaceReportServerStatePath(workspace: UsbUiTestWorkspace): string;
//# sourceMappingURL=reportServerManager.d.ts.map