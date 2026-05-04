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
exports.IOSRecordingProvider = void 0;
const child_process_1 = require("child_process");
const fsp = __importStar(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_events_1 = require("node:events");
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, node_util_1.promisify)(child_process_1.execFile);
/**
 * iOS screen recording via `xcrun simctl io <udid> recordVideo`.
 * Mirrors the studio-flutter implementation for booted simulators.
 */
class IOSRecordingProvider {
    static RECORDING_FOLDER = 'fr_ios_screen_recording';
    _execFileFn;
    _spawnFn;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
        this._spawnFn = params?.spawnFn ?? child_process_1.spawn;
    }
    get recordingFolder() {
        return IOSRecordingProvider.RECORDING_FOLDER;
    }
    get platformName() {
        return common_1.PLATFORM_IOS;
    }
    get fileExtension() {
        return 'mov';
    }
    async startRecordingProcess(params) {
        try {
            const args = ['simctl', 'io', params.deviceId, 'recordVideo', params.filePath];
            common_1.Logger.i(`IOSRecordingProvider: Starting recording for device ${params.deviceId} with command: xcrun ${args.join(' ')}`);
            const process = this._spawnFn('xcrun', args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            process.stdout?.on('data', (data) => {
                common_1.Logger.i(`xcrun simctl stdout: ${String(data)}`);
            });
            process.stderr?.on('data', (data) => {
                common_1.Logger.w(`xcrun simctl stderr: ${String(data)}`);
            });
            await this._awaitSpawn(process);
            return {
                process,
                response: new common_1.DeviceNodeResponse({
                    success: true,
                    message: `iOS recording started successfully for device: ${params.deviceId}, file: ${params.filePath}`,
                }),
                platformMetadata: {
                    tool: 'xcrun simctl',
                    deviceType: 'simulator',
                    command: 'recordVideo',
                },
            };
        }
        catch (error) {
            common_1.Logger.e(`IOSRecordingProvider: Failed to start recording for device ${params.deviceId}:`, error);
            throw new Error(`Failed to start iOS recording for device ${params.deviceId}: ${this._formatError(error)}`);
        }
    }
    async stopRecordingProcess(params) {
        try {
            const killSent = params.process.kill('SIGINT');
            common_1.Logger.i(`IOSRecordingProvider: Sent SIGINT to xcrun simctl process: ${killSent}`);
            if (!killSent) {
                common_1.Logger.e(`IOSRecordingProvider: Failed to deliver SIGINT for device: ${params.deviceId}, file: ${params.fileName}`);
                return new common_1.DeviceNodeResponse({
                    success: false,
                    message: 'Failed to send SIGINT to xcrun simctl process.',
                });
            }
            const exitCode = await this._waitForExit(params.process);
            common_1.Logger.i(`IOSRecordingProvider: xcrun simctl process exited with code ${exitCode} for device: ${params.deviceId}, file: ${params.fileName}`);
            const compressionResult = await this._compressVideo(params.filePath);
            if (!compressionResult.success) {
                common_1.Logger.w(`IOSRecordingProvider: Video compression failed for ${params.filePath}: ${compressionResult.message}`);
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: `iOS recording stopped successfully for device: ${params.deviceId}, file: ${params.fileName}`,
            });
        }
        catch (error) {
            common_1.Logger.e(`IOSRecordingProvider: Error stopping recording for device: ${params.deviceId}, file: ${params.fileName}`, error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Error stopping iOS recording: ${this._formatError(error)}`,
            });
        }
    }
    async checkAvailability() {
        try {
            const xcrunAvailable = await this._commandExists('xcrun');
            if (!xcrunAvailable) {
                return new common_1.DeviceNodeResponse({
                    success: false,
                    message: 'xcrun not found. Please ensure Xcode command line tools are installed.',
                });
            }
            common_1.Logger.i('IOSRecordingProvider: xcrun found in PATH');
            await this._execFileFn('xcrun', ['simctl', 'help']);
            common_1.Logger.i('IOSRecordingProvider: simctl is available');
            const ffmpegAvailable = await this._checkFfmpegAvailability();
            if (!ffmpegAvailable) {
                common_1.Logger.w('IOSRecordingProvider: ffmpeg not found - video compression will be disabled');
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'iOS recording tools (xcrun simctl) are available and recordVideo is supported. ' +
                    (ffmpegAvailable
                        ? 'Video compression enabled.'
                        : 'Video compression disabled (ffmpeg not found).'),
            });
        }
        catch (error) {
            common_1.Logger.e('IOSRecordingProvider: Error checking iOS recording availability', error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Error checking iOS recording tools: ${this._formatError(error)}`,
            });
        }
    }
    async cleanupPlatformResources(deviceId) {
        common_1.Logger.i(`IOSRecordingProvider: Cleaning up resources for device: ${deviceId}`);
    }
    async _commandExists(command) {
        try {
            await this._execFileFn('which', [command]);
            return true;
        }
        catch {
            return false;
        }
    }
    async _checkFfmpegAvailability() {
        return await this._commandExists('ffmpeg');
    }
    async _compressVideo(originalFilePath) {
        try {
            if (!(await this._checkFfmpegAvailability())) {
                return new common_1.DeviceNodeResponse({
                    success: false,
                    message: 'ffmpeg not available for video compression',
                });
            }
            await fsp.access(originalFilePath);
            const parsedPath = node_path_1.default.parse(originalFilePath);
            const compressedFilePath = node_path_1.default.join(parsedPath.dir, `${parsedPath.name}-small${parsedPath.ext}`);
            common_1.Logger.i(`IOSRecordingProvider: Starting video compression for ${originalFilePath}`);
            await this._execFileFn('ffmpeg', [
                '-y',
                '-i',
                originalFilePath,
                '-c:v',
                'libx264',
                '-crf',
                '40',
                compressedFilePath,
            ]);
            await fsp.access(compressedFilePath);
            await fsp.rm(originalFilePath, { force: true });
            await fsp.rename(compressedFilePath, originalFilePath);
            const finalFileStats = await fsp.stat(originalFilePath);
            common_1.Logger.i(`IOSRecordingProvider: Video compression completed. Final file size: ${(finalFileStats.size / 1024 / 1024).toFixed(2)} MB`);
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'Video compressed successfully',
            });
        }
        catch (error) {
            common_1.Logger.e('IOSRecordingProvider: Error during video compression', error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Video compression error: ${this._formatError(error)}`,
            });
        }
    }
    async _awaitSpawn(process) {
        if (process.pid !== undefined) {
            return;
        }
        await new Promise((resolve, reject) => {
            const handleSpawn = () => {
                cleanup();
                resolve();
            };
            const handleError = (error) => {
                cleanup();
                reject(error);
            };
            const cleanup = () => {
                process.off('spawn', handleSpawn);
                process.off('error', handleError);
            };
            process.once('spawn', handleSpawn);
            process.once('error', handleError);
        });
    }
    async _waitForExit(process) {
        if (process.exitCode !== null) {
            return process.exitCode;
        }
        const [code] = await (0, node_events_1.once)(process, 'exit');
        return code ?? null;
    }
    _formatError(error) {
        return error instanceof Error ? error.message : String(error);
    }
}
exports.IOSRecordingProvider = IOSRecordingProvider;
//# sourceMappingURL=IOSRecordingProvider.js.map