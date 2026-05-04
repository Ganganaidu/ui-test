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
const node_stream_1 = require("node:stream");
const common_1 = require("@usb-ui-test/common");
const IOSRecordingProvider_js_1 = require("./IOSRecordingProvider.js");
class FakeChildProcess extends node_events_1.EventEmitter {
    pid = 1234;
    exitCode = null;
    stdout = new node_stream_1.PassThrough();
    stderr = new node_stream_1.PassThrough();
    killSignals = [];
    kill(signal) {
        this.killSignals.push(signal);
        this.exitCode = 0;
        queueMicrotask(() => {
            this.emit('exit', 0, signal ?? null);
        });
        return true;
    }
}
(0, node_test_1.default)('IOSRecordingProvider starts xcrun simctl recording with the simulator UDID and host file path', async () => {
    const process = new FakeChildProcess();
    const spawnCalls = [];
    const provider = new IOSRecordingProvider_js_1.IOSRecordingProvider({
        spawnFn: ((command, args) => {
            spawnCalls.push({ command, args: args ?? [] });
            return process;
        }),
    });
    const response = await provider.startRecordingProcess({
        deviceId: 'SIM-1',
        filePath: '/tmp/run_case.mov',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run',
            testId: 'case',
            apiKey: 'key',
        }),
    });
    strict_1.default.equal(response.response.success, true);
    strict_1.default.deepEqual(spawnCalls, [
        {
            command: 'xcrun',
            args: ['simctl', 'io', 'SIM-1', 'recordVideo', '/tmp/run_case.mov'],
        },
    ]);
});
(0, node_test_1.default)('IOSRecordingProvider stops with SIGINT and succeeds even when ffmpeg is unavailable', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-ios-recording-'));
    const recordingPath = node_path_1.default.join(tempDir, 'run_case.mov');
    await (0, promises_1.writeFile)(recordingPath, 'fake-recording');
    const process = new FakeChildProcess();
    const provider = new IOSRecordingProvider_js_1.IOSRecordingProvider({
        execFileFn: async () => {
            throw new Error('command not available');
        },
    });
    const response = await provider.stopRecordingProcess({
        process: process,
        deviceId: 'SIM-1',
        fileName: 'run_case',
        filePath: recordingPath,
    });
    strict_1.default.equal(response.success, true);
    strict_1.default.deepEqual(process.killSignals, ['SIGINT']);
});
(0, node_test_1.default)('IOSRecordingProvider availability reports simctl support and optional ffmpeg compression', async () => {
    const execCalls = [];
    const provider = new IOSRecordingProvider_js_1.IOSRecordingProvider({
        execFileFn: async (file, args) => {
            execCalls.push({ file, args });
            if (file === 'which' && args[0] === 'ffmpeg') {
                throw new Error('ffmpeg missing');
            }
            return { stdout: '/usr/bin/mock', stderr: '' };
        },
    });
    const response = await provider.checkAvailability();
    strict_1.default.equal(response.success, true);
    strict_1.default.match(response.message ?? '', /Video compression disabled \(ffmpeg not found\)\./);
    strict_1.default.deepEqual(execCalls, [
        { file: 'which', args: ['xcrun'] },
        { file: 'xcrun', args: ['simctl', 'help'] },
        { file: 'which', args: ['ffmpeg'] },
    ]);
});
//# sourceMappingURL=IOSRecordingProvider.test.js.map