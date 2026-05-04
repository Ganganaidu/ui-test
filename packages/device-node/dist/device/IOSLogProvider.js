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
exports.IOSLogProvider = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("node:fs"));
const node_events_1 = require("node:events");
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, node_util_1.promisify)(child_process_1.execFile);
/**
 * iOS simulator log capture via `xcrun simctl spawn <udid> log stream --style compact`.
 */
class IOSLogProvider {
    _execFileFn;
    _spawnFn;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
        this._spawnFn = params?.spawnFn ?? child_process_1.spawn;
    }
    get fileExtension() {
        return 'log';
    }
    get platformName() {
        return common_1.PLATFORM_IOS;
    }
    async startLogCapture(params) {
        try {
            const writeStream = fs.createWriteStream(params.outputFilePath);
            const args = ['simctl', 'spawn', params.deviceId, 'log', 'stream', '--style', 'compact'];
            if (params.appIdentifier) {
                const predicate = [
                    `process == "${params.appIdentifier}"`,
                    'NOT subsystem BEGINSWITH "com.apple.dt.xctest"',
                    'NOT subsystem BEGINSWITH "com.apple.UIKit"',
                    'NOT subsystem BEGINSWITH "com.apple.BackBoard"',
                ].join(' AND ');
                args.push('--predicate', predicate);
                common_1.Logger.i(`IOSLogProvider: Filtering logs with predicate: ${predicate}`);
            }
            common_1.Logger.i(`IOSLogProvider: Starting log capture for device ${params.deviceId} with command: xcrun ${args.join(' ')}`);
            const childProcess = this._spawnFn('xcrun', args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            childProcess.stdout?.pipe(writeStream);
            childProcess.stderr?.on('data', (data) => {
                common_1.Logger.w(`xcrun simctl log stderr: ${String(data)}`);
            });
            return {
                process: childProcess,
                response: new common_1.DeviceNodeResponse({
                    success: true,
                    message: `iOS log capture started for device: ${params.deviceId}, file: ${params.outputFilePath}`,
                }),
            };
        }
        catch (error) {
            common_1.Logger.e(`IOSLogProvider: Failed to start log capture for device ${params.deviceId}:`, error);
            throw new Error(`Failed to start iOS log capture for device ${params.deviceId}: ${this._formatError(error)}`);
        }
    }
    async stopLogCapture(params) {
        try {
            const killSent = params.process.kill('SIGINT');
            common_1.Logger.i(`IOSLogProvider: Sent SIGINT to xcrun simctl log process: ${killSent}`);
            if (!killSent) {
                if (params.process.exitCode !== null) {
                    common_1.Logger.i(`IOSLogProvider: xcrun simctl log process already exited (code ${params.process.exitCode}) for file: ${params.outputFilePath}`);
                }
                else {
                    common_1.Logger.e(`IOSLogProvider: Failed to deliver SIGINT for log capture file: ${params.outputFilePath}`);
                    return new common_1.DeviceNodeResponse({
                        success: false,
                        message: 'Failed to send SIGINT to xcrun simctl log process.',
                    });
                }
            }
            const exitCode = await this._waitForExit(params.process);
            common_1.Logger.i(`IOSLogProvider: xcrun simctl log process exited with code ${exitCode} for file: ${params.outputFilePath}`);
            // Flush and close the write stream piped from stdout
            if (params.process.stdout) {
                params.process.stdout.unpipe();
            }
            return new common_1.DeviceNodeResponse({
                success: true,
                message: `iOS log capture stopped successfully for file: ${params.outputFilePath}`,
            });
        }
        catch (error) {
            common_1.Logger.e(`IOSLogProvider: Error stopping log capture for file: ${params.outputFilePath}`, error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `Error stopping iOS log capture: ${this._formatError(error)}`,
            });
        }
    }
    async checkAvailability() {
        try {
            await this._execFileFn('which', ['xcrun']);
            await this._execFileFn('xcrun', ['simctl', 'help']);
            return new common_1.DeviceNodeResponse({
                success: true,
                message: 'iOS log capture tools (xcrun simctl) are available.',
            });
        }
        catch (error) {
            common_1.Logger.e('IOSLogProvider: Error checking xcrun availability', error);
            return new common_1.DeviceNodeResponse({
                success: false,
                message: `xcrun not found. Please ensure Xcode command line tools are installed: ${this._formatError(error)}`,
            });
        }
    }
    async cleanupPlatformResources(deviceId) {
        common_1.Logger.i(`IOSLogProvider: Cleaning up resources for device: ${deviceId}`);
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
exports.IOSLogProvider = IOSLogProvider;
//# sourceMappingURL=IOSLogProvider.js.map