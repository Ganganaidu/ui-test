"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = __importDefault(require("node:test"));
const node_events_1 = require("node:events");
const common_1 = require("@usb-ui-test/common");
const RecordingManager_js_1 = require("./RecordingManager.js");
class FakeChildProcess extends node_events_1.EventEmitter {
    pid = 1234;
    exitCode = null;
    kill() {
        return true;
    }
}
(0, node_test_1.default)('RecordingManager creates sanitized iOS output paths and stops using the same file', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-recording-manager-'));
    const process = new FakeChildProcess();
    let startedFilePath = '';
    let stoppedFilePath = '';
    const provider = {
        recordingFolder: 'fr_ios_screen_recording',
        platformName: common_1.PLATFORM_IOS,
        fileExtension: 'mov',
        async startRecordingProcess(params) {
            startedFilePath = params.filePath;
            return {
                process: process,
                response: new common_1.DeviceNodeResponse({ success: true }),
            };
        },
        async stopRecordingProcess(params) {
            stoppedFilePath = params.filePath;
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async checkAvailability() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async cleanupPlatformResources() { },
    };
    const manager = new RecordingManager_js_1.RecordingManager({
        providers: { [common_1.PLATFORM_IOS]: provider },
        cwdProvider: () => tempDir,
    });
    const startResponse = await manager.startRecording({
        deviceId: 'SIM-1',
        platform: common_1.PLATFORM_IOS,
        sdkVersion: '17',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run 1',
            testId: 'case/name',
            apiKey: 'key',
        }),
    });
    strict_1.default.equal(startResponse.success, true);
    strict_1.default.equal(startedFilePath, node_path_1.default.join(tempDir, 'fr_ios_screen_recording', 'run_1_case_name.mov'));
    await (0, promises_1.writeFile)(startedFilePath, 'recording');
    const stopResponse = await manager.stopRecording('run 1', 'case/name', {
        platform: common_1.PLATFORM_IOS,
        keepOutput: false,
    });
    strict_1.default.equal(stopResponse.success, true);
    strict_1.default.equal(stoppedFilePath, startedFilePath);
    await strict_1.default.rejects(() => (0, promises_1.readFile)(startedFilePath));
});
(0, node_test_1.default)('RecordingManager creates sanitized Android output paths and stops using the same mp4 file', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-recording-manager-'));
    const process = new FakeChildProcess();
    let startedFilePath = '';
    let stoppedFilePath = '';
    const provider = {
        recordingFolder: 'fr_android_screen_recording',
        platformName: common_1.PLATFORM_ANDROID,
        fileExtension: 'mp4',
        async startRecordingProcess(params) {
            startedFilePath = params.filePath;
            return {
                process: process,
                response: new common_1.DeviceNodeResponse({ success: true }),
            };
        },
        async stopRecordingProcess(params) {
            stoppedFilePath = params.filePath;
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async checkAvailability() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async cleanupPlatformResources() { },
    };
    const manager = new RecordingManager_js_1.RecordingManager({
        providers: { [common_1.PLATFORM_ANDROID]: provider },
        cwdProvider: () => tempDir,
    });
    const startResponse = await manager.startRecording({
        deviceId: 'emulator-5554',
        platform: common_1.PLATFORM_ANDROID,
        sdkVersion: '34',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run 1',
            testId: 'case/name',
            apiKey: 'key',
        }),
    });
    strict_1.default.equal(startResponse.success, true);
    strict_1.default.equal(startedFilePath, node_path_1.default.join(tempDir, 'fr_android_screen_recording', 'run_1_case_name.mp4'));
    await (0, promises_1.writeFile)(startedFilePath, 'recording');
    const stopResponse = await manager.stopRecording('run 1', 'case/name', {
        platform: common_1.PLATFORM_ANDROID,
        keepOutput: false,
    });
    strict_1.default.equal(stopResponse.success, true);
    strict_1.default.equal(stoppedFilePath, startedFilePath);
    await strict_1.default.rejects(() => (0, promises_1.readFile)(startedFilePath));
});
(0, node_test_1.default)('RecordingManager uses an explicit output path instead of the legacy platform folder', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-recording-manager-'));
    const process = new FakeChildProcess();
    let startedFilePath = '';
    const provider = {
        recordingFolder: 'fr_android_screen_recording',
        platformName: common_1.PLATFORM_ANDROID,
        fileExtension: 'mp4',
        async startRecordingProcess(params) {
            startedFilePath = params.filePath;
            return {
                process: process,
                response: new common_1.DeviceNodeResponse({ success: true }),
            };
        },
        async stopRecordingProcess() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async checkAvailability() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async cleanupPlatformResources() { },
    };
    const manager = new RecordingManager_js_1.RecordingManager({
        providers: { [common_1.PLATFORM_ANDROID]: provider },
        cwdProvider: () => tempDir,
    });
    const explicitOutputPath = node_path_1.default.join(tempDir, 'artifacts', 'run-1', 'tests', 'case-name', 'recording.mp4');
    const startResponse = await manager.startRecording({
        deviceId: 'emulator-5554',
        platform: common_1.PLATFORM_ANDROID,
        sdkVersion: '34',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run 1',
            testId: 'case/name',
            apiKey: 'key',
            outputFilePath: explicitOutputPath,
        }),
    });
    strict_1.default.equal(startResponse.success, true);
    strict_1.default.equal(startedFilePath, explicitOutputPath);
});
(0, node_test_1.default)('RecordingManager preserves failed-stop output files when the process has already exited', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-recording-manager-'));
    const process = new FakeChildProcess();
    process.exitCode = 0;
    const outputPath = node_path_1.default.join(tempDir, 'artifacts', 'run-1', 'tests', 'case-1', 'recording.mp4');
    const provider = {
        recordingFolder: 'fr_android_screen_recording',
        platformName: common_1.PLATFORM_ANDROID,
        fileExtension: 'mp4',
        async startRecordingProcess() {
            return {
                process: process,
                response: new common_1.DeviceNodeResponse({ success: true }),
            };
        },
        async stopRecordingProcess() {
            return new common_1.DeviceNodeResponse({
                success: false,
                message: 'recording file is incomplete',
            });
        },
        async checkAvailability() {
            return new common_1.DeviceNodeResponse({ success: true });
        },
        async cleanupPlatformResources() { },
    };
    const manager = new RecordingManager_js_1.RecordingManager({
        providers: { [common_1.PLATFORM_ANDROID]: provider },
        cwdProvider: () => tempDir,
    });
    const startResponse = await manager.startRecording({
        deviceId: 'emulator-5554',
        platform: common_1.PLATFORM_ANDROID,
        sdkVersion: '34',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run-1',
            testId: 'case-1',
            apiKey: 'key',
            outputFilePath: outputPath,
        }),
    });
    strict_1.default.equal(startResponse.success, true);
    await (0, promises_1.writeFile)(outputPath, 'partial recording');
    const stopResponse = await manager.stopRecording('run-1', 'case-1', {
        platform: common_1.PLATFORM_ANDROID,
        keepOutput: true,
    });
    strict_1.default.equal(stopResponse.success, false);
    await manager.cleanupDevice('emulator-5554', {
        platform: common_1.PLATFORM_ANDROID,
        keepOutput: false,
    });
    strict_1.default.equal(await (0, promises_1.readFile)(outputPath, 'utf-8'), 'partial recording');
});
(0, node_test_1.default)('RecordingManager reports unsupported platforms when no provider is configured', async () => {
    const manager = new RecordingManager_js_1.RecordingManager({
        providers: {},
    });
    const response = await manager.startRecording({
        deviceId: 'emulator-5554',
        platform: common_1.PLATFORM_ANDROID,
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run',
            testId: 'case',
            apiKey: 'key',
        }),
    });
    strict_1.default.equal(response.success, false);
    strict_1.default.equal(response.message, 'Screen recording is not configured for platform: android');
});
//# sourceMappingURL=RecordingManager.test.js.map