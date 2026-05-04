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
exports.defaultLogCaptureManager = exports.LogCaptureManager = void 0;
const fsp = __importStar(require("node:fs/promises"));
const os = __importStar(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const common_1 = require("@usb-ui-test/common");
const AndroidLogcatProvider_js_1 = require("./AndroidLogcatProvider.js");
const IOSLogProvider_js_1 = require("./IOSLogProvider.js");
const LogInfo_js_1 = require("./LogInfo.js");
const MAP_KEY_DELIMITER = '###';
class LogCaptureManager {
    _logProcessMap = new Map();
    _logInfoMap = new Map();
    _deviceToLogKeysMap = new Map();
    _stoppedTestCases = new Set();
    _providers;
    constructor(params) {
        const providers = params?.providers ?? {
            [common_1.PLATFORM_ANDROID]: new AndroidLogcatProvider_js_1.AndroidLogcatProvider({ adbPath: params?.adbPath }),
            [common_1.PLATFORM_IOS]: new IOSLogProvider_js_1.IOSLogProvider(),
        };
        this._providers = new Map(Object.entries(providers));
    }
    getMapKey(runId, testId) {
        return `${runId}${MAP_KEY_DELIMITER}${testId}`;
    }
    async startLogCapture(params) {
        const mapKey = this.getMapKey(params.runId, params.testId);
        this._stoppedTestCases.delete(mapKey);
        if (this._logProcessMap.has(mapKey)) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'Log capture already in progress for this test case',
            });
        }
        const provider = this._providers.get(params.platform);
        if (!provider) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Log capture is not configured for platform: ${params.platform}`,
            });
        }
        const availability = await provider.checkAvailability();
        if (!availability.success) {
            return availability;
        }
        const logDir = node_path_1.default.join(os.tmpdir(), 'usb-ui-test-logs');
        await fsp.mkdir(logDir, { recursive: true });
        const sanitizedRunId = this._sanitizeForFilename(params.runId);
        const sanitizedTestId = this._sanitizeForFilename(params.testId);
        const filePath = node_path_1.default.join(logDir, `${sanitizedRunId}_${sanitizedTestId}.${provider.fileExtension}`);
        const logInfo = new LogInfo_js_1.LogInfo({
            deviceId: params.deviceId,
            filePath,
            runId: params.runId,
            testId: params.testId,
            platform: params.platform,
        });
        this._logInfoMap.set(mapKey, logInfo);
        this._deviceToLogKeysMap.set(params.deviceId, [
            ...(this._deviceToLogKeysMap.get(params.deviceId) ?? []),
            mapKey,
        ]);
        try {
            const providerResult = await provider.startLogCapture({
                deviceId: params.deviceId,
                outputFilePath: filePath,
                appIdentifier: params.appIdentifier,
            });
            if (!providerResult.response.success) {
                this._logInfoMap.delete(mapKey);
                this._removeDeviceLogKey(params.deviceId, mapKey);
                return providerResult.response;
            }
            this._logProcessMap.set(mapKey, providerResult.process);
            return new common_1.DeviceNodeResponse({
                success: true,
                message: providerResult.response.message ??
                    `Log capture started successfully for test case: ${params.testId}`,
                data: {
                    filePath,
                    platform: params.platform,
                    startedAt: logInfo.startTime.toISOString(),
                },
            });
        }
        catch (error) {
            this._logInfoMap.delete(mapKey);
            this._removeDeviceLogKey(params.deviceId, mapKey);
            common_1.Logger.e(`Failed to start log capture for test case: ${params.testId}`, error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Failed to start log capture: ${this._formatError(error)}`,
            });
        }
    }
    async stopLogCapture(runId, testId, options) {
        const mapKey = this.getMapKey(runId, testId);
        if (this._stoppedTestCases.has(mapKey)) {
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'Log capture already stopped for this test case',
            });
        }
        const process = this._logProcessMap.get(mapKey);
        if (!process) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'No active log capture found for this test case',
            });
        }
        const logInfo = this._logInfoMap.get(mapKey);
        if (!logInfo) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'Log info not found',
            });
        }
        const provider = this._providers.get(options.platform);
        if (!provider) {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Log capture is not configured for platform: ${options.platform}`,
            });
        }
        const stopResult = await provider.stopLogCapture({
            process,
            outputFilePath: logInfo.filePath,
        });
        this._finalizeStoppedLogCapture(mapKey, logInfo);
        if (!stopResult.success) {
            return stopResult;
        }
        if (options.keepOutput === false) {
            try {
                await fsp.rm(logInfo.filePath, { force: true });
            }
            catch (error) {
                common_1.Logger.w(`LogCaptureManager: Failed to delete local log file ${logInfo.filePath}: ${this._formatError(error)}`);
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: `Log capture aborted and cleaned up for test case: ${testId}`,
            });
        }
        return new common_1.DeviceNodeResponse({
            success: true,
            message: `Log capture stopped successfully for test case: ${testId}`,
            data: {
                filePath: logInfo.filePath,
                startedAt: logInfo.startTime.toISOString(),
                completedAt: logInfo.endTime?.toISOString() ?? new Date().toISOString(),
            },
        });
    }
    async cleanupDevice(deviceId, options) {
        const logKeys = [...(this._deviceToLogKeysMap.get(deviceId) ?? [])];
        for (const mapKey of logKeys) {
            const [runId, testId] = mapKey.split(MAP_KEY_DELIMITER);
            if (runId && testId) {
                await this.stopLogCapture(runId, testId, {
                    platform: options.platform,
                    keepOutput: options.keepOutput ?? false,
                });
            }
        }
        this._deviceToLogKeysMap.delete(deviceId);
        for (const mapKey of logKeys) {
            this._stoppedTestCases.delete(mapKey);
        }
        const provider = this._providers.get(options.platform);
        if (provider) {
            await provider.cleanupPlatformResources(deviceId);
        }
    }
    async abortLogCapture(runId, options) {
        const matchingEntries = [...this._logInfoMap.entries()].filter(([, logInfo]) => logInfo.runId === runId && logInfo.deviceId === options.deviceId);
        for (const [, logInfo] of matchingEntries) {
            await this.stopLogCapture(logInfo.runId, logInfo.testId, {
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
    _finalizeStoppedLogCapture(mapKey, logInfo) {
        this._logProcessMap.delete(mapKey);
        this._stoppedTestCases.add(mapKey);
        this._removeDeviceLogKey(logInfo.deviceId, mapKey);
        logInfo.markAsEnded();
        this._logInfoMap.delete(mapKey);
    }
    _removeDeviceLogKey(deviceId, mapKey) {
        const keys = this._deviceToLogKeysMap.get(deviceId);
        if (!keys) {
            return;
        }
        const nextKeys = keys.filter((key) => key !== mapKey);
        if (nextKeys.length === 0) {
            this._deviceToLogKeysMap.delete(deviceId);
            return;
        }
        this._deviceToLogKeysMap.set(deviceId, nextKeys);
    }
    _formatError(error) {
        return error instanceof Error ? error.message : String(error);
    }
}
exports.LogCaptureManager = LogCaptureManager;
exports.defaultLogCaptureManager = new LogCaptureManager();
//# sourceMappingURL=LogCaptureManager.js.map