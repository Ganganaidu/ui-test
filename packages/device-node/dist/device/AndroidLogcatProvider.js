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
exports.AndroidLogcatProvider = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("node:fs"));
const node_events_1 = require("node:events");
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, node_util_1.promisify)(child_process_1.execFile);
/**
 * Android device log capture via `adb logcat`.
 * Clears the ring buffer before capture, then streams in threadtime format.
 */
class AndroidLogcatProvider {
    _execFileFn;
    _spawnFn;
    _adbPath;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
        this._spawnFn = params?.spawnFn ?? child_process_1.spawn;
        this._adbPath = params?.adbPath ?? 'adb';
    }
    get fileExtension() {
        return 'log';
    }
    get platformName() {
        return common_1.PLATFORM_ANDROID;
    }
    async startLogCapture(params) {
        try {
            // Clear the logcat ring buffer before capture
            await this._execFileFn(this._adbPath, ['-s', params.deviceId, 'logcat', '-c']);
            common_1.Logger.i(`AndroidLogcatProvider: Cleared logcat ring buffer for device ${params.deviceId}`);
            const writeStream = fs.createWriteStream(params.outputFilePath);
            const args = ['-s', params.deviceId, 'logcat', '-v', 'threadtime'];
            if (params.appIdentifier) {
                try {
                    const { stdout } = await this._execFileFn(this._adbPath, [
                        '-s', params.deviceId, 'shell', 'pidof', params.appIdentifier,
                    ]);
                    const pids = String(stdout).trim().split(/\s+/).filter(Boolean);
                    for (const pid of pids) {
                        args.push('--pid', pid);
                    }
                    if (pids.length > 0) {
                        common_1.Logger.i(`AndroidLogcatProvider: Filtering by PID(s) ${pids.join(', ')} for package ${params.appIdentifier}`);
                    }
                    else {
                        common_1.Logger.w(`AndroidLogcatProvider: pidof returned no PIDs for ${params.appIdentifier}, capturing all logs`);
                    }
                }
                catch {
                    common_1.Logger.w(`AndroidLogcatProvider: Failed to resolve PID for ${params.appIdentifier}, capturing all logs`);
                }
            }
            common_1.Logger.i(`AndroidLogcatProvider: Starting log capture for device ${params.deviceId} with command: adb ${args.join(' ')}`);
            const childProcess = this._spawnFn(this._adbPath, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            childProcess.stdout?.pipe(writeStream);
            childProcess.stderr?.on('data', (data) => {
                common_1.Logger.w(`adb logcat stderr: ${String(data)}`);
            });
            return {
                process: childProcess,
                response: new common_1.DeviceNodeResponse({
                    success: true,
                    message: `Android log capture started for device: ${params.deviceId}, file: ${params.outputFilePath}`,
                }),
            };
        }
        catch (error) {
            common_1.Logger.e(`AndroidLogcatProvider: Failed to start log capture for device ${params.deviceId}:`, error);
            throw new Error(`Failed to start Android log capture for device ${params.deviceId}: ${this._formatError(error)}`);
        }
    }
    async stopLogCapture(params) {
        try {
            const killSent = params.process.kill('SIGINT');
            common_1.Logger.i(`AndroidLogcatProvider: Sent SIGINT to adb logcat process: ${killSent}`);
            if (!killSent) {
                if (params.process.exitCode !== null) {
                    common_1.Logger.i(`AndroidLogcatProvider: adb logcat process already exited (code ${params.process.exitCode}) for file: ${params.outputFilePath}`);
                }
                else {
                    common_1.Logger.e(`AndroidLogcatProvider: Failed to deliver SIGINT for log capture file: ${params.outputFilePath}`);
                    return new common_1.DeviceNodeResponse({
                        success: false,
                        message: 'Failed to send SIGINT to adb logcat process.',
                    });
                }
            }
            const exitCode = await this._waitForExit(params.process);
            common_1.Logger.i(`AndroidLogcatProvider: adb logcat process exited with code ${exitCode} for file: ${params.outputFilePath}`);
            // Flush and close the write stream piped from stdout
            if (params.process.stdout) {
                params.process.stdout.unpipe();
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: `Android log capture stopped successfully for file: ${params.outputFilePath}`,
            });
        }
        catch (error) {
            common_1.Logger.e(`AndroidLogcatProvider: Error stopping log capture for file: ${params.outputFilePath}`, error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Error stopping Android log capture: ${this._formatError(error)}`,
            });
        }
    }
    async checkAvailability() {
        try {
            await this._execFileFn('which', [this._adbPath]);
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'Android log capture tools (adb) are available.',
            });
        }
        catch (error) {
            common_1.Logger.e('AndroidLogcatProvider: Error checking adb availability', error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `adb not found. Please ensure Android SDK platform-tools are installed: ${this._formatError(error)}`,
            });
        }
    }
    async cleanupPlatformResources(deviceId) {
        common_1.Logger.i(`AndroidLogcatProvider: Cleaning up resources for device: ${deviceId}`);
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
exports.AndroidLogcatProvider = AndroidLogcatProvider;
//# sourceMappingURL=AndroidLogcatProvider.js.map