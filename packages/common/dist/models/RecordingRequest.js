"use strict";
// Port of common/model/RecordingRequest.dart
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingRequest = void 0;
/**
 * Request payload used to start a screen recording session.
 */
class RecordingRequest {
    testId;
    runId;
    apiKey;
    bitRate;
    outputFilePath;
    constructor(params) {
        this.testId = params.testId;
        this.runId = params.runId;
        this.apiKey = params.apiKey;
        this.bitRate = params.bitRate ?? '1000000';
        this.outputFilePath = params.outputFilePath;
    }
    static fromJson(json) {
        return new RecordingRequest({
            testId: json['testId'],
            runId: json['runId'],
            apiKey: json['apiKey'],
            bitRate: json['bitRate'] ?? '1000000',
            outputFilePath: json['outputFilePath'],
        });
    }
    toJson() {
        return {
            testId: this.testId,
            runId: this.runId,
            apiKey: this.apiKey,
            bitRate: this.bitRate,
            outputFilePath: this.outputFilePath,
        };
    }
}
exports.RecordingRequest = RecordingRequest;
//# sourceMappingURL=RecordingRequest.js.map