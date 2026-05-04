export type FatalProviderStatusCode = 400 | 401;
export interface TerminalFailureSignal {
    kind: 'provider';
    provider: string;
    modelName: string;
    statusCode: FatalProviderStatusCode;
    message: string;
}
export declare class FatalProviderError extends Error {
    readonly provider: string;
    readonly modelName: string;
    readonly statusCode: FatalProviderStatusCode;
    constructor(params: {
        provider: string;
        modelName: string;
        statusCode: FatalProviderStatusCode;
        detail: string;
        cause?: unknown;
    });
    static isInstance(error: unknown): error is FatalProviderError;
    toSignal(): TerminalFailureSignal;
}
export declare function classifyFatalProviderError(error: unknown, context: {
    provider: string;
    modelName: string;
}): FatalProviderError | undefined;
export declare function terminalFailureFromError(error: unknown): TerminalFailureSignal | undefined;
//# sourceMappingURL=providerFailure.d.ts.map