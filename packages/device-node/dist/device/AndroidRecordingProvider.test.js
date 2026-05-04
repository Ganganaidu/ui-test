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
const AndroidRecordingProvider_js_1 = require("./AndroidRecordingProvider.js");
class FakeChildProcess extends node_events_1.EventEmitter {
    pid = 1234;
    exitCode = null;
    signalCode = null;
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
(0, node_test_1.default)('AndroidRecordingProvider starts headless scrcpy with the selected device serial and mp4 output path', async () => {
    const process = new FakeChildProcess();
    const spawnCalls = [];
    const provider = new AndroidRecordingProvider_js_1.AndroidRecordingProvider({
        execFileFn: async () => ({ stdout: '/usr/bin/scrcpy', stderr: '' }),
        spawnFn: ((command, args) => {
            spawnCalls.push({ command, args: args ?? [] });
            return process;
        }),
        delayFn: async () => { },
    });
    const response = await provider.startRecordingProcess({
        deviceId: 'emulator-5554',
        filePath: '/tmp/run_case.mp4',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run',
            testId: 'case',
            apiKey: 'key',
        }),
    });
    strict_1.default.equal(response.response.success, true);
    strict_1.default.deepEqual(spawnCalls, [
        {
            command: 'scrcpy',
            args: [
                '--serial',
                'emulator-5554',
                '--no-window',
                '--no-playback',
                '--no-control',
                '--no-audio',
                '--record',
                '/tmp/run_case.mp4',
                '--record-format',
                'mp4',
            ],
        },
    ]);
});
(0, node_test_1.default)('AndroidRecordingProvider fails startup if scrcpy exits during the readiness window', async () => {
    const process = new FakeChildProcess();
    const provider = new AndroidRecordingProvider_js_1.AndroidRecordingProvider({
        execFileFn: async () => ({ stdout: '/usr/bin/scrcpy', stderr: '' }),
        spawnFn: ((_command, _args) => {
            queueMicrotask(() => {
                process.stderr.write('adb device unauthorized');
                process.exitCode = 1;
                process.emit('exit', 1, null);
            });
            return process;
        }),
        delayFn: async () => {
            await new Promise((resolve) => setImmediate(resolve));
        },
    });
    await strict_1.default.rejects(() => provider.startRecordingProcess({
        deviceId: 'emulator-5554',
        filePath: '/tmp/run_case.mp4',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run',
            testId: 'case',
            apiKey: 'key',
        }),
    }), /scrcpy exited before recording became ready \(code=1\): adb device unauthorized/);
});
(0, node_test_1.default)('AndroidRecordingProvider reports SIGINT interruption instead of scrcpy-server push noise', async () => {
    // Repro of the original bug: a SIGINT during startup produced a "1 file pushed" red
    // herring because _formatStartupExit previously led with raw stdout. Now the signal is
    // surfaced explicitly via ScrcpyStartupInterruptedError and the banner is suppressed.
    const process = new FakeChildProcess();
    const provider = new AndroidRecordingProvider_js_1.AndroidRecordingProvider({
        execFileFn: async () => ({ stdout: '/usr/bin/scrcpy', stderr: '' }),
        spawnFn: ((_command, _args) => {
            queueMicrotask(() => {
                process.stdout.write('/opt/homebrew/Cellar/scrcpy/3.3.4/share/scrcpy/scrcpy-server: ' +
                    '1 file pushed, 0 skipped. 132.5 MB/s (90980 bytes in 0.001s)\n');
                process.signalCode = 'SIGINT';
                process.emit('exit', null, 'SIGINT');
            });
            return process;
        }),
        delayFn: async () => {
            await new Promise((resolve) => setImmediate(resolve));
        },
    });
    await strict_1.default.rejects(() => provider.startRecordingProcess({
        deviceId: 'emulator-5554',
        filePath: '/tmp/run_case.mp4',
        recordingRequest: new common_1.RecordingRequest({
            runId: 'run',
            testId: 'case',
            apiKey: 'key',
        }),
    }), (error) => {
        strict_1.default.ok(error instanceof AndroidRecordingProvider_js_1.ScrcpyStartupInterruptedError);
        strict_1.default.equal(error.signal, 'SIGINT');
        strict_1.default.match(error.message, /interrupted by SIGINT/);
        strict_1.default.doesNotMatch(error.message, /1 file pushed/);
        return true;
    });
});
(0, node_test_1.default)('AndroidRecordingProvider stops with SIGINT and validates the recorded mp4 output', async () => {
    const tempDir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'usb-ui-test-android-recording-'));
    const recordingPath = node_path_1.default.join(tempDir, 'run_case.mp4');
    await (0, promises_1.writeFile)(recordingPath, 'fake-recording');
    const process = new FakeChildProcess();
    const provider = new AndroidRecordingProvider_js_1.AndroidRecordingProvider({
        execFileFn: async () => ({ stdout: '/usr/bin/scrcpy', stderr: '' }),
    });
    const response = await provider.stopRecordingProcess({
        process: process,
        deviceId: 'emulator-5554',
        fileName: 'run_case',
        filePath: recordingPath,
    });
    strict_1.default.equal(response.success, true);
    strict_1.default.deepEqual(process.killSignals, ['SIGINT']);
});
(0, node_test_1.default)('AndroidRecordingProvider availability reports when scrcpy is missing', async () => {
    const provider = new AndroidRecordingProvider_js_1.AndroidRecordingProvider({
        execFileFn: async () => {
            throw new Error('scrcpy missing');
        },
    });
    const response = await provider.checkAvailability();
    strict_1.default.equal(response.success, false);
    strict_1.default.match(response.message ?? '', /scrcpy not found/i);
});
//# sourceMappingURL=AndroidRecordingProvider.test.js.map