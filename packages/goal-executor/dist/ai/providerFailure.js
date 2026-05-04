"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FatalProviderError = void 0;
exports.classifyFatalProviderError = classifyFatalProviderError;
exports.terminalFailureFromError = terminalFailureFromError;
const ai_1 = require("ai");
class FatalProviderError extends Error {
    provider;
    modelName;
    statusCode;
    constructor(params) {
        super(`AI provider error (${params.provider}/${params.modelName}, HTTP ${params.statusCode}): ${params.detail}`);
        this.name = 'FatalProviderError';
        this.provider = params.provider;
        this.modelName = params.modelName;
        this.statusCode = params.statusCode;
        if (params.cause !== undefined) {
            this.cause = params.cause;
        }
    }
    static isInstance(error) {
        return error instanceof FatalProviderError;
    }
    toSignal() {
        return {
            kind: 'provider',
            provider: this.provider,
            modelName: this.modelName,
            statusCode: this.statusCode,
            message: this.message,
        };
    }
}
exports.FatalProviderError = FatalProviderError;
function classifyFatalProviderError(error, context) {
    if (FatalProviderError.isInstance(error)) {
        return error;
    }
    if (ai_1.APICallError.isInstance(error) &&
        (error.statusCode === 400 || error.statusCode === 401)) {
        return new FatalProviderError({
            provider: context.provider,
            modelName: context.modelName,
            statusCode: error.statusCode,
            detail: normalizeDetail(error.message),
            cause: error,
        });
    }
    return undefined;
}
function terminalFailureFromError(error) {
    if (FatalProviderError.isInstance(error)) {
        return error.toSignal();
    }
    if (error instanceof Error && error.cause !== undefined) {
        return terminalFailureFromError(error.cause);
    }
    return undefined;
}
function normalizeDetail(value) {
    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized === '' ? 'Request failed' : normalized;
}
//# sourceMappingURL=providerFailure.js.map