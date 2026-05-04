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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidRecordingProvider = exports.ScrcpyStartupInterruptedError = void 0;
const child_process_1 = require("child_process");
const fsp = __importStar(require("node:fs/promises"));
const node_events_1 = require("node:events");
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, node_util_1.promisify)(child_process_1.execFile);
class ScrcpyStartupInterruptedError extends Error {
    signal;
    constructor(signal) {
        super(`scrcpy recording startup interrupted by ${signal} before it became ready`);
        this.name = 'ScrcpyStartupInterruptedError';
        this.signal = signal;
    }
}
exports.ScrcpyStartupInterruptedError = ScrcpyStartupInterruptedError;
/**
 * Android screen recording via host-installed `scrcpy`.
 * Uses headless recording to keep parity with the existing iOS artifact flow.
 */
class AndroidRecordingProvider {
    static RECORDING_FOLDER = 'fr_android_screen_recording';
    static DEFAULT_STARTUP_SETTLE_MS = 1000;
    _execFileFn;
    _spawnFn;
    _delayFn;
    _startupSettleMs;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
        this._spawnFn = params?.spawnFn ?? child_process_1.spawn;
        this._delayFn = params?.delayFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
        this._startupSettleMs =
            params?.startupSettleMs ?? AndroidRecordingProvider.DEFAULT_STARTUP_SETTLE_MS;
    }
    get recordingFolder() {
        return AndroidRecordingProvider.RECORDING_FOLDER;
    }
    get platformName() {
        return common_1.PLATFORM_ANDROID;
    }
    get fileExtension() {
        return 'mp4';
    }
    async startRecordingProcess(params) {
        try {
            const scrcpyAvailable = await this._commandExists('scrcpy');
            if (!scrcpyAvailable) {
                throw new Error('scrcpy not found in PATH');
            }
            const args = [
                '--serial',
                params.deviceId,
                '--no-window',
                '--no-playback',
                '--no-control',
                '--no-audio',
                '--record',
                params.filePath,
                '--record-format',
                'mp4',
            ];
            common_1.Logger.i(`AndroidRecordingProvider: Starting recording for device ${params.deviceId} with command: scrcpy ${args.join(' ')}`);
            const stdoutChunks = [];
            const stderrChunks = [];
            const process = this._spawnFn('scrcpy', args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            process.stdout?.on('data', (data) => {
                const message = String(data);
                stdoutChunks.push(message);
                common_1.Logger.i(`scrcpy stdout: ${message}`);
            });
            process.stderr?.on('data', (data) => {
                const message = String(data);
                stderrChunks.push(message);
                common_1.Logger.w(`scrcpy stderr: ${message}`);
            });
            await this._awaitSpawn(process);
            const startupState = await this._waitForStableStartup(process, {
                stdoutChunks,
                stderrChunks,
            });
            if (startupState.exited) {
                if (startupState.signal === 'SIGINT' || startupState.signal === 'SIGTERM') {
                    throw new ScrcpyStartupInterruptedError(startupState.signal);
                }
                throw new Error(startupState.message);
            }
            return {
                process,
                response: new common_1.DeviceNodeResponse({
                    success: true,
                    message: `Android recording started successfully for device: ${params.deviceId}, file: ${params.filePath}`,
                }),
                platformMetadata: {
                    tool: 'scrcpy',
                    deviceType: 'adb',
                    command: 'record',
                    container: 'mp4',
                    audio: false,
                },
            };
        }
        catch (error) {
            if (error instanceof ScrcpyStartupInterruptedError) {
                common_1.Logger.w(`AndroidRecordingProvider: scrcpy startup for device ${params.deviceId} was interrupted by ${error.signal} before it became ready`);
                throw error;
            }
            common_1.Logger.e(`AndroidRecordingProvider: Failed to start recording for device ${params.deviceId}:`, error);
            throw new Error(`Failed to start Android recording for device ${params.deviceId}: ${this._formatError(error)}`);
        }
    }
    async stopRecordingProcess(params) {
        try {
            const killSent = params.process.kill('SIGINT');
            common_1.Logger.i(`AndroidRecordingProvider: Sent SIGINT to scrcpy process: ${killSent}`);
            if (!killSent) {
                common_1.Logger.e(`AndroidRecordingProvider: Failed to deliver SIGINT for device: ${params.deviceId}, file: ${params.fileName}`);
                return new common_1.DeviceNodeResponse({
                    success: false,
                    message: 'Failed to send SIGINT to scrcpy process.',
                });
            }
            const { code: exitCode, signal } = await this._waitForExit(params.process);
            common_1.Logger.i(`AndroidRecordingProvider: scrcpy process exited with code=${exitCode ?? 'unknown'} signal=${signal ?? 'none'} for device: ${params.deviceId}, file: ${params.fileName}`);
            await fsp.access(params.filePath);
            const stats = await fsp.stat(params.filePath);
            if (stats.size <= 0) {
                return new common_1.DeviceNodeResponse({
                    success: false,
                    message: `Android recording file is empty: ${params.filePath}`,
                });
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: `Android recording stopped successfully for device: ${params.deviceId}, file: ${params.fileName}`,
            });
        }
        catch (error) {
            common_1.Logger.e(`AndroidRecordingProvider: Error stopping recording for device: ${params.deviceId}, file: ${params.fileName}`, error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Error stopping Android recording: ${this._formatError(error)}`,
            });
        }
    }
    async checkAvailability() {
        try {
            const scrcpyAvailable = await this._commandExists('scrcpy');
            if (!scrcpyAvailable) {
                return new common_1.DeviceNodeResponse({
                    success: false,
                    message: 'scrcpy not found. Please ensure scrcpy is installed and available on PATH.',
                });
            }
            await this._execFileFn('scrcpy', ['--version']);
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'Android recording tools (scrcpy) are available.',
            });
        }
        catch (error) {
            common_1.Logger.e('AndroidRecordingProvider: Error checking Android recording availability', error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Error checking Android recording tools: ${this._formatError(error)}`,
            });
        }
    }
    async cleanupPlatformResources(deviceId) {
        common_1.Logger.i(`AndroidRecordingProvider: Cleaning up resources for device: ${deviceId}`);
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
    async _waitForStableStartup(process, logs) {
        if (process.exitCode !== null || process.signalCode !== null) {
            return {
                exited: true,
                message: this._formatStartupExit(process.exitCode, process.signalCode, logs),
                signal: process.signalCode,
            };
        }
        const timeoutResult = this._delayFn(this._startupSettleMs).then(() => ({ exited: false }));
        const exitResult = this._waitForExit(process).then(({ code, signal }) => ({
            exited: true,
            message: this._formatStartupExit(code, signal, logs),
            signal,
        }));
        return await Promise.race([timeoutResult, exitResult]);
    }
    _formatStartupExit(exitCode, signal, logs) {
        if (signal === 'SIGINT' || signal === 'SIGTERM') {
            return `scrcpy recording startup interrupted by ${signal} before it became ready`;
        }
        const cause = signal !== null
            ? `signal=${signal}`
            : `code=${exitCode === null ? 'unknown' : String(exitCode)}`;
        const stderr = logs.stderrChunks.join('').trim();
        const stdout = logs.stdoutChunks.join('').trim();
        const detail = stderr || stdout;
        return detail
            ? `scrcpy exited before recording became ready (${cause}): ${detail}`
            : `scrcpy exited before recording became ready (${cause})`;
    }
    async _waitForExit(process) {
        if (process.exitCode !== null || process.signalCode !== null) {
            return {
                code: process.exitCode,
                signal: process.signalCode,
            };
        }
        const [code, signal] = await (0, node_events_1.once)(process, 'exit');
        return {
            code: code ?? null,
            signal: signal ?? null,
        };
    }
    _formatError(error) {
        return error instanceof Error ? error.message : String(error);
    }
}
exports.AndroidRecordingProvider = AndroidRecordingProvider;
//# sourceMappingURL=AndroidRecordingProvider.js.map