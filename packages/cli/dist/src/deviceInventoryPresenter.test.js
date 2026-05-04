"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_stream_1 = require("node:stream");
const node_test_1 = __importDefault(require("node:test"));
const deviceInventoryPresenter_js_1 = require("./deviceInventoryPresenter.js");
function createEntry(params) {
    const defaultState = params.platform === 'android' ? 'connected' : 'booted';
    return {
        selectionId: params.selectionId,
        platform: params.platform,
        targetKind: params.platform === 'android' ? 'android-emulator' : 'ios-simulator',
        state: params.state ?? defaultState,
        stateDetail: params.stateDetail ?? null,
        runnable: params.runnable ?? true,
        startable: params.startable ?? false,
        displayName: params.displayName,
        rawId: params.selectionId,
        modelName: params.displayName,
        osVersionLabel: params.platform === 'android' ? 'Android 14' : 'iOS 17.5',
        deviceInfo: null,
        transcripts: [],
    };
}
const TWO_ENTRIES = [
    createEntry({
        selectionId: 'android:1',
        platform: 'android',
        displayName: 'Pixel 8 - Android 14 - emulator-5554',
    }),
    createEntry({
        selectionId: 'ios:1',
        platform: 'ios',
        displayName: 'iPhone 15 Pro - iOS 17.5 - BOOTED-DEVICE-1',
    }),
];
(0, node_test_1.default)('promptForDeviceSelection reprompts until a valid device number is entered (TTY)', async () => {
    const input = new node_stream_1.PassThrough();
    const output = new node_stream_1.PassThrough();
    let outputText = '';
    output.on('data', (chunk) => {
        outputText += String(chunk);
    });
    input.write('9\n');
    setImmediate(() => {
        input.end('2\n');
    });
    const selected = await (0, deviceInventoryPresenter_js_1.promptForDeviceSelection)({
        heading: 'Select a device',
        entries: TWO_ENTRIES,
        io: {
            input,
            output,
            isTTY: true,
        },
    });
    strict_1.default.equal(selected.selectionId, 'ios:1');
    strict_1.default.match(outputText, /Invalid selection/);
    strict_1.default.match(outputText, /Enter a device number/);
});
(0, node_test_1.default)('promptForDeviceSelection selects from piped stdin without prompting (non-TTY)', async () => {
    const input = new node_stream_1.PassThrough();
    const output = new node_stream_1.PassThrough();
    let outputText = '';
    output.on('data', (chunk) => {
        outputText += String(chunk);
    });
    input.end('1\n');
    const selected = await (0, deviceInventoryPresenter_js_1.promptForDeviceSelection)({
        heading: 'Select a device',
        entries: TWO_ENTRIES,
        io: {
            input,
            output,
            isTTY: false,
        },
    });
    strict_1.default.equal(selected.selectionId, 'android:1');
    strict_1.default.match(outputText, /Select a device/);
    strict_1.default.match(outputText, /1\. Pixel 8/);
    strict_1.default.doesNotMatch(outputText, /Enter a device number/);
});
(0, node_test_1.default)('promptForDeviceSelection throws a clean error when stdin is closed without input (non-TTY)', async () => {
    const input = new node_stream_1.PassThrough();
    const output = new node_stream_1.PassThrough();
    let outputText = '';
    output.on('data', (chunk) => {
        outputText += String(chunk);
    });
    input.end();
    await strict_1.default.rejects(() => (0, deviceInventoryPresenter_js_1.promptForDeviceSelection)({
        heading: 'Select a device',
        entries: TWO_ENTRIES,
        io: {
            input,
            output,
            isTTY: false,
        },
    }), (error) => {
        strict_1.default.ok(error instanceof Error);
        strict_1.default.match(error.message, /Multiple devices available/);
        strict_1.default.match(error.message, /echo "1"/);
        strict_1.default.doesNotMatch(error.message, /Enter a device number/);
        return true;
    });
    strict_1.default.match(outputText, /Select a device/);
    strict_1.default.match(outputText, /Pixel 8/);
});
(0, node_test_1.default)('promptForDeviceSelection rejects invalid piped input (non-TTY)', async () => {
    const input = new node_stream_1.PassThrough();
    const output = new node_stream_1.PassThrough();
    input.end('99\n');
    await strict_1.default.rejects(() => (0, deviceInventoryPresenter_js_1.promptForDeviceSelection)({
        heading: 'Select a device',
        entries: TWO_ENTRIES,
        io: {
            input,
            output,
            isTTY: false,
        },
    }), (error) => {
        strict_1.default.ok(error instanceof Error);
        strict_1.default.match(error.message, /Invalid device number "99"/);
        strict_1.default.match(error.message, /1, 2/);
        return true;
    });
});
(0, node_test_1.default)('formatDeviceSelectionList shows non-selectable targets with explicit states', () => {
    const rendered = (0, deviceInventoryPresenter_js_1.formatDeviceSelectionList)([
        createEntry({
            selectionId: 'android:1',
            platform: 'android',
            displayName: 'Pixel 8 - Android 14 - emulator-5554',
        }),
        createEntry({
            selectionId: 'android:2',
            platform: 'android',
            displayName: 'Pixel 7 - R52N30',
            state: 'unauthorized',
            runnable: false,
            startable: false,
        }),
        createEntry({
            selectionId: 'ios:1',
            platform: 'ios',
            displayName: 'iPhone 15 - iOS 17.5 - SHUTDOWN-DEVICE-1',
            state: 'shutdown',
            runnable: false,
            startable: true,
        }),
        createEntry({
            selectionId: 'ios:2',
            platform: 'ios',
            displayName: 'Unavailable Simulator - iOS 18 - UNAVAILABLE-DEVICE',
            state: 'unavailable',
            stateDetail: 'runtime profile missing',
            runnable: false,
            startable: false,
        }),
    ], [
        createEntry({
            selectionId: 'android:1',
            platform: 'android',
            displayName: 'Pixel 8 - Android 14 - emulator-5554',
        }),
    ]);
    strict_1.default.match(rendered.text, /Ready Targets/);
    strict_1.default.match(rendered.text, /1\. Pixel 8 - Android 14 - emulator-5554 \(connected\)/);
    strict_1.default.match(rendered.text, /Available to Start/);
    strict_1.default.match(rendered.text, /- iPhone 15 - iOS 17\.5 - SHUTDOWN-DEVICE-1 \(shutdown\)/);
    strict_1.default.match(rendered.text, /Unavailable Targets/);
    strict_1.default.match(rendered.text, /- Pixel 7 - R52N30 \(unauthorized\)/);
    strict_1.default.match(rendered.text, /- Unavailable Simulator - iOS 18 - UNAVAILABLE-DEVICE \(unavailable: runtime profile missing\)/);
    strict_1.default.deepEqual(rendered.numberedEntries.map(({ entry }) => entry.selectionId), ['android:1']);
});
(0, node_test_1.default)('formatDiagnosticsForOutput includes raw stdout and stderr blocks', () => {
    const rendered = (0, deviceInventoryPresenter_js_1.formatDiagnosticsForOutput)([
        {
            scope: 'android-connected',
            summary: 'Android device discovery failed.',
            blocking: true,
            transcripts: [
                {
                    command: 'adb devices -l',
                    stdout: 'List of devices attached\n',
                    stderr: 'adb server is out of date\n',
                    exitCode: 1,
                },
            ],
        },
    ]);
    strict_1.default.match(rendered, /Command: adb devices -l/);
    strict_1.default.match(rendered, /stdout:\nList of devices attached/);
    strict_1.default.match(rendered, /stderr:\nadb server is out of date/);
    strict_1.default.match(rendered, /exitCode: 1/);
});
//# sourceMappingURL=deviceInventoryPresenter.test.js.map