"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRecordingManager = exports.RecordingManager = void 0;
const fsp = __importStar(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const common_1 = require("@usb-ui-test/common");
const AndroidRecordingProvider_js_1 = require("./AndroidRecordingProvider.js");
const IOSRecordingProvider_js_1 = require("./IOSRecordingProvider.js");
const RecordingInfo_js_1 = require("./RecordingInfo.js");
const MAP_KEY_DELIMITER = '###';
class RecordingManager {
    _recordingProcessMap = new Map();
    _recordingInfoMap = new Map();
    _deviceToRecordingKeysMap = new Map();
    _stoppedTestCases = new Set();
    _providers;
    _cwdProvider;
    constructor(params) {
        const providers = params?.providers ?? {
            [common_1.PLATFORM_ANDROID]: new AndroidRecordingProvider_js_1.AndroidRecordingProvider(),
            [common_1.PLATFORM_IOS]: new IOSRecordingProvider_js_1.IOSRecordingProvider(),
        };
        this._providers = new Map(Object.entries(providers));
        this._cwdProvider = params?.cwdProvider ?? (() => process.cwd());
    }
    getMapKey(runId, testId) {
        return `${runId}${MAP_KEY_DELIMITER}${testId}`;
    }
    async startRecording(params) {
        const mapKey = this.getMapKey(params.recordingRequest.runId, params.recordingRequest.testId);
        this._stoppedTestCases.delete(mapKey);
        if (this._recordingProcessMap.has(mapKey)) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'Recording already in progress for this test case',
            });
        }
        const provider = this._providers.get(params.platform);
        if (!provider) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Screen recording is not configured for platform: ${params.platform}`,
            });
        }
        const explicitOutputPath = params.recordingRequest.outputFilePath
            ? node_path_1.default.resolve(params.recordingRequest.outputFilePath)
            : undefined;
        const recordingDir = explicitOutputPath
            ? node_path_1.default.dirname(explicitOutputPath)
            : node_path_1.default.resolve(this._cwdProvider(), provider.recordingFolder);
        await fsp.mkdir(recordingDir, { recursive: true });
        const sanitizedTestRunId = this._sanitizeForFilename(params.recordingRequest.runId);
        const sanitizedTestCaseId = this._sanitizeForFilename(params.recordingRequest.testId);
        const fallbackFileName = `${sanitizedTestRunId}_${sanitizedTestCaseId}.${provider.fileExtension}`;
        const filePath = explicitOutputPath ?? node_path_1.default.join(recordingDir, fallbackFileName);
        const fileName = node_path_1.default.basename(filePath);
        const recordingInfo = new RecordingInfo_js_1.RecordingInfo({
            deviceId: params.deviceId,
            fileName,
            filePath,
            runId: params.recordingRequest.runId,
            testId: params.recordingRequest.testId,
            platform: params.platform,
            apiKey: params.recordingRequest.apiKey,
        });
        this._recordingInfoMap.set(mapKey, recordingInfo);
        this._deviceToRecordingKeysMap.set(params.deviceId, [
            ...(this._deviceToRecordingKeysMap.get(params.deviceId) ?? []),
            mapKey,
        ]);
        try {
            const providerResult = await provider.startRecordingProcess({
                deviceId: params.deviceId,
                filePath,
                recordingRequest: params.recordingRequest,
                sdkVersion: params.sdkVersion,
            });
            if (!providerResult.response.success) {
                this._recordingInfoMap.delete(mapKey);
                this._removeDeviceRecordingKey(params.deviceId, mapKey);
                return providerResult.response;
            }
            this._recordingProcessMap.set(mapKey, providerResult.process);
            return new common_1.DeviceNodeResponse({
                success: true,
                message: providerResult.response.message ??
                    `Recording started successfully for test case: ${params.recordingRequest.testId}`,
                data: {
                    fileName,
                    filePath,
                    platform: params.platform,
                    startedAt: recordingInfo.startTime.toISOString(),
                    ...(providerResult.platformMetadata
                        ? { platformMetadata: providerResult.platformMetadata }
                        : {}),
                },
            });
        }
        catch (error) {
            this._recordingInfoMap.delete(mapKey);
            this._removeDeviceRecordingKey(params.deviceId, mapKey);
            common_1.Logger.e(`Failed to start recording for test case: ${params.recordingRequest.testId}`, error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Failed to start recording: ${this._formatError(error)}`,
            });
        }
    }
    async stopRecording(runId, testId, options) {
        const mapKey = this.getMapKey(runId, testId);
        if (this._stoppedTestCases.has(mapKey)) {
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'Recording already stopped for this test case',
            });
        }
        const process = this._recordingProcessMap.get(mapKey);
        if (!process) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'No active recording found for this test case',
            });
        }
        const recordingInfo = this._recordingInfoMap.get(mapKey);
        if (!recordingInfo) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'Recording info not found',
            });
        }
        const provider = this._providers.get(options.platform);
        if (!provider) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Screen recording is not configured for platform: ${options.platform}`,
            });
        }
        const stopResult = await provider.stopRecordingProcess({
            process,
            deviceId: recordingInfo.deviceId,
            fileName: node_path_1.default.parse(recordingInfo.fileName).name,
            filePath: recordingInfo.filePath,
        });
        if (!stopResult.success) {
            if (await this._shouldPreserveFailedStopOutput(process, recordingInfo, options)) {
                this._finalizeStoppedRecording(mapKey, recordingInfo);
            }
            return stopResult;
        }
        this._finalizeStoppedRecording(mapKey, recordingInfo);
        if (options.keepOutput === false) {
            try {
                await fsp.rm(recordingInfo.filePath, { force: true });
            }
            catch (error) {
                common_1.Logger.w(`RecordingManager: Failed to delete local recording file ${recordingInfo.filePath}: ${this._formatError(error)}`);
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: `Recording aborted and cleaned up for test case: ${testId}`,
            });
        }
        return new common_1.DeviceNodeResponse({
            success: true,
            message: `Recording stopped successfully for test case: ${testId}`,
            data: {
                fileName: recordingInfo.fileName,
                filePath: recordingInfo.filePath,
                startedAt: recordingInfo.startTime.toISOString(),
                completedAt: recordingInfo.endTime?.toISOString() ?? new Date().toISOString(),
            },
        });
    }
    async cleanupDevice(deviceId, options) {
        const recordingKeys = [...(this._deviceToRecordingKeysMap.get(deviceId) ?? [])];
        for (const mapKey of recordingKeys) {
            const [runId, testId] = mapKey.split(MAP_KEY_DELIMITER);
            if (runId && testId) {
                await this.stopRecording(runId, testId, {
                    platform: options.platform,
                    keepOutput: options.keepOutput ?? false,
                });
            }
        }
        this._deviceToRecordingKeysMap.delete(deviceId);
        for (const mapKey of recordingKeys) {
            this._stoppedTestCases.delete(mapKey);
        }
        const provider = this._providers.get(options.platform);
        if (provider) {
            await provider.cleanupPlatformResources(deviceId);
        }
    }
    async abortRecording(runId, options) {
        const matchingEntries = [...this._recordingInfoMap.entries()].filter(([, recordingInfo]) => recordingInfo.runId === runId && recordingInfo.deviceId === options.deviceId);
        for (const [, recordingInfo] of matchingEntries) {
            await this.stopRecording(recordingInfo.runId, recordingInfo.testId, {
                platform: options.platform,
                keepOutput: options.keepOutput ?? false,
            });
        }
    }
    _sanitizeForFilename(value) {
        return value
            .replaceAll(/[/\\:*?"<>|]/g, '_')
            .replaceAll(/\s+/g, '_')
            .replaceAll(/_+/g, '_');
    }
    _finalizeStoppedRecording(mapKey, recordingInfo) {
        this._recordingProcessMap.delete(mapKey);
        this._stoppedTestCases.add(mapKey);
        this._removeDeviceRecordingKey(recordingInfo.deviceId, mapKey);
        recordingInfo.markAsEnded();
        this._recordingInfoMap.delete(mapKey);
    }
    async _shouldPreserveFailedStopOutput(process, recordingInfo, options) {
        if (options.keepOutput === false || process.exitCode === null) {
            return false;
        }
        try {
            await fsp.access(recordingInfo.filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    _removeDeviceRecordingKey(deviceId, mapKey) {
        const keys = this._deviceToRecordingKeysMap.get(deviceId);
        if (!keys) {
            return;
        }
        const nextKeys = keys.filter((key) => key !== mapKey);
        if (nextKeys.length === 0) {
            this._deviceToRecordingKeysMap.delete(deviceId);
            return;
        }
        this._deviceToRecordingKeysMap.set(deviceId, nextKeys);
    }
    _formatError(error) {
        return error instanceof Error ? error.message : String(error);
    }
}
exports.RecordingManager = RecordingManager;
exports.defaultRecordingManager = new RecordingManager();
//# sourceMappingURL=RecordingManager.js.map