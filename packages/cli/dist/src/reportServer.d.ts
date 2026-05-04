export declare function serveReportWorkspace(params: {
    workspaceRoot: string;
    artifactsDir: string;
    port: number;
}): Promise<{
    url: string;
    close(): Promise<void>;
}>;
//# sourceMappingURL=reportServer.d.ts.map