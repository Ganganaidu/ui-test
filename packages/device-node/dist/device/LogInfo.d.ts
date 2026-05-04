export declare class LogInfo {
    readonly deviceId: string;
    readonly filePath: string;
    readonly runId: string;
    readonly testId: string;
    readonly platform: string;
    readonly startTime: Date;
    endTime: Date | null;
    constructor(params: {
        deviceId: string;
        filePath: string;
        runId: string;
        testId: string;
        platform: string;
    });
    markAsEnded(): void;
}
//# sourceMappingURL=LogInfo.d.ts.map