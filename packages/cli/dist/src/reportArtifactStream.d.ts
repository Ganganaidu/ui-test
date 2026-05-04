import type { IncomingMessage, ServerResponse } from 'node:http';
export declare class ArtifactRangeNotSatisfiableError extends Error {
    readonly size: number;
    constructor(size: number);
}
export declare function resolveArtifactPath(artifactsDir: string, relativePath: string): string;
export declare function decodeArtifactPath(rawRelativePath: string): string;
export declare function serveArtifactHttp(params: {
    artifactsDir: string;
    relativePath: string;
    request: IncomingMessage;
    response: ServerResponse;
}): Promise<void>;
export declare function renderHtmlErrorPage(params: {
    title: string;
    message: string;
}): string;
//# sourceMappingURL=reportArtifactStream.d.ts.map