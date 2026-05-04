"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogInfo = void 0;
class LogInfo {
    deviceId;
    filePath;
    runId;
    testId;
    platform;
    startTime;
    endTime;
    constructor(params) {
        this.deviceId = params.deviceId;
        this.filePath = params.filePath;
        this.runId = params.runId;
        this.testId = params.testId;
        this.platform = params.platform;
        this.startTime = new Date();
        this.endTime = null;
    }
    markAsEnded() {
        this.endTime = new Date();
    }
}
exports.LogInfo = LogInfo;
//# sourceMappingURL=LogInfo.js.map