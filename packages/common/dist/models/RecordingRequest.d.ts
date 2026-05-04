/**
 * Request payload used to start a screen recording session.
 */
export declare class RecordingRequest {
    readonly testId: string;
    readonly runId: string;
    readonly apiKey: string;
    readonly bitRate: string;
    readonly outputFilePath?: string;
    constructor(params: {
        testId: string;
        runId: string;
        apiKey: string;
        bitRate?: string;
        outputFilePath?: string;
    });
    static fromJson(json: Record<string, unknown>): RecordingRequest;
    toJson(): Record<string, unknown>;
}
//# sourceMappingURL=RecordingRequest.d.ts.map