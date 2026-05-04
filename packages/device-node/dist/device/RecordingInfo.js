"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordingInfo = void 0;
class RecordingInfo {
    deviceId;
    fileName;
    filePath;
    runId;
    testId;
    platform;
    apiKey;
    startTime;
    endTime;
    constructor(params) {
        this.deviceId = params.deviceId;
        this.fileName = params.fileName;
        this.filePath = params.filePath;
        this.runId = params.runId;
        this.testId = params.testId;
        this.platform = params.platform;
        this.apiKey = params.apiKey;
        this.startTime = new Date();
        this.endTime = null;
    }
    markAsEnded() {
        this.endTime = new Date();
    }
}
exports.RecordingInfo = RecordingInfo;
//# sourceMappingURL=RecordingInfo.js.map