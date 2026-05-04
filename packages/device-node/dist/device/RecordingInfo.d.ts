export declare class RecordingInfo {
    readonly deviceId: string;
    readonly fileName: string;
    readonly filePath: string;
    readonly runId: string;
    readonly testId: string;
    readonly platform: string;
    readonly apiKey: string;
    readonly startTime: Date;
    endTime: Date | null;
    constructor(params: {
        deviceId: string;
        fileName: string;
        filePath: string;
        runId: string;
        testId: string;
        platform: string;
        apiKey: string;
    });
    markAsEnded(): void;
}
//# sourceMappingURL=RecordingInfo.d.ts.map