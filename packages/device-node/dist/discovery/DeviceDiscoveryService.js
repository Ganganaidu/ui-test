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
exports.DeviceDiscoveryService = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("node:fs"));
const fsp = __importStar(require("node:fs/promises"));
const node_os_1 = require("node:os");
const path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, node_util_1.promisify)(child_process_1.execFile);
class DeviceDiscoveryService {
    static STARTUP_TIMEOUT_MS = 120_000;
    static POLL_INTERVAL_MS = 1_500;
    static ANDROID_LAUNCH_SETTLE_MS = 1_000;
    _execFileFn;
    _spawnFn;
    _delayFn;
    _readFileFn;
    _fileExistsFn;
    _env;
    _homeDir;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
        this._spawnFn = params?.spawnFn ?? child_process_1.spawn;
        this._delayFn =
            params?.delayFn ??
                ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
        this._readFileFn = params?.readFileFn ?? ((filePath, encoding) => fsp.readFile(filePath, encoding));
        this._fileExistsFn = params?.fileExistsFn ?? fs.existsSync;
        this._env = params?.env ?? process.env;
        this._homeDir = params?.homeDir ?? (0, node_os_1.homedir)();
    }
    async getAndroidDevices(adbPath) {
        const result = await this._probeAndroidConnected(adbPath);
        return result.entries
            .filter((entry) => entry.runnable && entry.deviceInfo !== null)
            .map((entry) => entry.deviceInfo);
    }
    async getIOSDevices() {
        const result = await this._probeIOSSimulators();
        return result.entries
            .filter((entry) => entry.runnable && entry.deviceInfo !== null)
            .map((entry) => entry.deviceInfo);
    }
    async detectInventory(adbPath) {
        const [androidConnected, iosSimulators] = await Promise.all([
            this._probeAndroidConnected(adbPath),
            this._probeIOSSimulators(),
        ]);
        const runningEmulatorSelectionIds = new Set(androidConnected.entries
            .filter((entry) => entry.targetKind === 'android-emulator' && entry.runnable)
            .map((entry) => entry.selectionId));
        const androidTargets = await this._probeAndroidTargets(adbPath, runningEmulatorSelectionIds);
        return {
            entries: [
                ...androidConnected.entries,
                ...androidTargets.entries,
                ...iosSimulators.entries,
            ],
            diagnostics: [
                ...androidConnected.diagnostics,
                ...androidTargets.diagnostics,
                ...iosSimulators.diagnostics,
            ],
        };
    }
    async startTarget(entry, adbPath) {
        if (!entry.startable) {
            return null;
        }
        if (entry.targetKind === 'ios-simulator') {
            return await this._startIOSSimulator(entry, adbPath);
        }
        if (entry.targetKind === 'android-emulator') {
            return await this._startAndroidEmulator(entry, adbPath);
        }
        return {
            scope: 'startup',
            summary: `Automatic startup is not supported for ${entry.displayName}.`,
            blocking: true,
            transcripts: [],
        };
    }
    async _probeAndroidConnected(adbPath) {
        if (!adbPath) {
            return {
                entries: [],
                diagnostics: [
                    {
                        scope: 'android-connected',
                        summary: 'Android discovery is unavailable because adb was not found.',
                        blocking: true,
                        transcripts: [],
                    },
                ],
            };
        }
        const listResult = await this._runCommand(adbPath, ['devices', '-l']);
        if (!listResult.ok) {
            return {
                entries: [],
                diagnostics: [
                    {
                        scope: 'android-connected',
                        summary: 'Android device discovery failed.',
                        blocking: true,
                        transcripts: [listResult.transcript],
                    },
                ],
            };
        }
        const entries = [];
        const lines = listResult.stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith('List of devices attached'));
        for (const line of lines) {
            const parsedLine = this._parseAdbDeviceLine(line);
            if (!parsedLine) {
                continue;
            }
            const { serial, state } = parsedLine;
            const inlineModel = this._parseInlineAdbField(line, 'model');
            if (state === 'offline' || state === 'unauthorized') {
                const emulator = serial.startsWith('emulator-');
                entries.push({
                    selectionId: emulator ? `android-emulator:${serial}` : `android-device:${serial}`,
                    platform: 'android',
                    targetKind: emulator ? 'android-emulator' : 'android-device',
                    state,
                    stateDetail: null,
                    runnable: false,
                    startable: false,
                    displayName: this._formatAndroidDisplayName({
                        modelName: inlineModel,
                        osVersionLabel: null,
                        id: serial,
                    }),
                    rawId: serial,
                    modelName: inlineModel,
                    osVersionLabel: null,
                    deviceInfo: null,
                    transcripts: [],
                });
                continue;
            }
            if (state !== 'device') {
                const emulator = serial.startsWith('emulator-');
                entries.push({
                    selectionId: emulator ? `android-emulator:${serial}` : `android-device:${serial}`,
                    platform: 'android',
                    targetKind: emulator ? 'android-emulator' : 'android-device',
                    state: 'unavailable',
                    stateDetail: state,
                    runnable: false,
                    startable: false,
                    displayName: this._formatAndroidDisplayName({
                        modelName: inlineModel,
                        osVersionLabel: null,
                        id: serial,
                    }),
                    rawId: serial,
                    modelName: inlineModel,
                    osVersionLabel: null,
                    deviceInfo: null,
                    transcripts: [],
                });
                continue;
            }
            const details = await this._loadAndroidConnectedDetails(adbPath, serial, inlineModel);
            const primaryName = details.avdName ?? details.modelName ?? inlineModel;
            const osVersionLabel = this._formatAndroidOsLabel({
                releaseVersion: details.releaseVersion,
                sdkVersion: details.sdkVersion,
            });
            const selectionId = details.avdName
                ? `android-avd:${details.avdName}`
                : details.emulator
                    ? `android-emulator:${serial}`
                    : `android-device:${serial}`;
            entries.push({
                selectionId,
                platform: 'android',
                targetKind: details.emulator ? 'android-emulator' : 'android-device',
                state: 'connected',
                stateDetail: null,
                runnable: true,
                startable: false,
                displayName: this._formatAndroidDisplayName({
                    modelName: primaryName,
                    osVersionLabel,
                    id: serial,
                }),
                rawId: serial,
                modelName: primaryName ?? null,
                osVersionLabel,
                deviceInfo: new common_1.DeviceInfo({
                    id: serial,
                    deviceUUID: serial,
                    isAndroid: true,
                    sdkVersion: details.sdkVersion,
                    name: primaryName ?? inlineModel,
                }),
                transcripts: details.transcripts,
            });
        }
        return { entries, diagnostics: [] };
    }
    async _probeAndroidTargets(adbPath, runningEmulatorSelectionIds) {
        if (!adbPath) {
            return { entries: [], diagnostics: [] };
        }
        const emulatorPath = await this._resolveAndroidToolPath('emulator', [
            ['emulator', 'emulator'],
        ]);
        if (!emulatorPath) {
            return {
                entries: [],
                diagnostics: [
                    {
                        scope: 'android-targets',
                        summary: 'Android emulator inventory is unavailable because the emulator binary was not found.',
                        blocking: false,
                        transcripts: [],
                    },
                ],
            };
        }
        const listResult = await this._runCommand(emulatorPath, ['-list-avds']);
        if (!listResult.ok) {
            return {
                entries: [],
                diagnostics: [
                    {
                        scope: 'android-targets',
                        summary: 'Android emulator inventory failed.',
                        blocking: false,
                        transcripts: [listResult.transcript],
                    },
                ],
            };
        }
        const avdNames = listResult.stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        if (avdNames.length === 0) {
            return { entries: [], diagnostics: [] };
        }
        const diagnostics = [];
        const avdRecords = await this._loadAvdManagerRecords(diagnostics);
        const avdMetadata = await Promise.all(avdNames.map((name) => this._loadAvdMetadata(name, avdRecords)));
        const entries = avdMetadata
            .filter((metadata) => !runningEmulatorSelectionIds.has(`android-avd:${metadata.name}`))
            .map((metadata) => {
            const displayName = this._formatAndroidDisplayName({
                modelName: metadata.modelName ?? metadata.name,
                osVersionLabel: metadata.osVersionLabel,
                id: metadata.name,
            });
            return {
                selectionId: `android-avd:${metadata.name}`,
                platform: 'android',
                targetKind: 'android-emulator',
                state: 'shutdown',
                stateDetail: null,
                runnable: false,
                startable: true,
                displayName,
                rawId: metadata.name,
                modelName: metadata.modelName,
                osVersionLabel: metadata.osVersionLabel,
                deviceInfo: null,
                transcripts: [],
            };
        });
        return { entries, diagnostics };
    }
    async _probeIOSSimulators() {
        const listResult = await this._runCommand('xcrun', ['simctl', 'list', '-j']);
        if (!listResult.ok) {
            return {
                entries: [],
                diagnostics: [
                    {
                        scope: 'ios-simulators',
                        summary: 'iOS simulator discovery failed.',
                        blocking: true,
                        transcripts: [listResult.transcript],
                    },
                ],
            };
        }
        let parsed;
        try {
            parsed = JSON.parse(listResult.stdout);
        }
        catch {
            return {
                entries: [],
                diagnostics: [
                    {
                        scope: 'ios-simulators',
                        summary: 'iOS simulator discovery returned invalid JSON.',
                        blocking: true,
                        transcripts: [listResult.transcript],
                    },
                ],
            };
        }
        const entries = [];
        for (const [runtime, runtimeDevices] of Object.entries(parsed.devices ?? {})) {
            const runtimeLabel = this._parseIOSRuntimeLabel(runtime);
            if (!runtimeLabel || !runtime.includes('SimRuntime.iOS-')) {
                continue;
            }
            for (const device of runtimeDevices) {
                const udid = typeof device['udid'] === 'string' && device['udid'].trim().length > 0
                    ? device['udid'].trim()
                    : null;
                const name = typeof device['name'] === 'string' && device['name'].trim().length > 0
                    ? device['name'].trim()
                    : null;
                const state = typeof device['state'] === 'string' && device['state'].trim().length > 0
                    ? device['state'].trim()
                    : null;
                if (!udid || !name) {
                    continue;
                }
                const availabilityError = typeof device['availabilityError'] === 'string' &&
                    device['availabilityError'].trim().length > 0
                    ? device['availabilityError'].trim()
                    : null;
                if (device['isAvailable'] === false) {
                    entries.push({
                        selectionId: `ios-simulator:${udid}`,
                        platform: 'ios',
                        targetKind: 'ios-simulator',
                        state: 'unavailable',
                        stateDetail: availabilityError ?? 'simulator unavailable',
                        runnable: false,
                        startable: false,
                        displayName: this._formatIOSDisplayName(name, runtimeLabel.label, udid),
                        rawId: udid,
                        modelName: name,
                        osVersionLabel: runtimeLabel.label,
                        deviceInfo: null,
                        transcripts: [],
                    });
                    continue;
                }
                if (state === 'Booted') {
                    entries.push({
                        selectionId: `ios-simulator:${udid}`,
                        platform: 'ios',
                        targetKind: 'ios-simulator',
                        state: 'booted',
                        stateDetail: null,
                        runnable: true,
                        startable: false,
                        displayName: this._formatIOSDisplayName(name, runtimeLabel.label, udid),
                        rawId: udid,
                        modelName: name,
                        osVersionLabel: runtimeLabel.label,
                        deviceInfo: new common_1.DeviceInfo({
                            id: udid,
                            deviceUUID: udid,
                            isAndroid: false,
                            sdkVersion: runtimeLabel.sdkVersion,
                            name,
                        }),
                        transcripts: [],
                    });
                }
                else if (state === 'Shutdown') {
                    entries.push({
                        selectionId: `ios-simulator:${udid}`,
                        platform: 'ios',
                        targetKind: 'ios-simulator',
                        state: 'shutdown',
                        stateDetail: null,
                        runnable: false,
                        startable: true,
                        displayName: this._formatIOSDisplayName(name, runtimeLabel.label, udid),
                        rawId: udid,
                        modelName: name,
                        osVersionLabel: runtimeLabel.label,
                        deviceInfo: null,
                        transcripts: [],
                    });
                }
                else {
                    entries.push({
                        selectionId: `ios-simulator:${udid}`,
                        platform: 'ios',
                        targetKind: 'ios-simulator',
                        state: 'unavailable',
                        stateDetail: state ?? 'unknown state',
                        runnable: false,
                        startable: false,
                        displayName: this._formatIOSDisplayName(name, runtimeLabel.label, udid),
                        rawId: udid,
                        modelName: name,
                        osVersionLabel: runtimeLabel.label,
                        deviceInfo: null,
                        transcripts: [],
                    });
                }
            }
        }
        return { entries, diagnostics: [] };
    }
    async _startIOSSimulator(entry, adbPath) {
        const bootResult = await this._runCommand('xcrun', ['simctl', 'boot', entry.rawId]);
        if (!bootResult.ok) {
            return {
                scope: 'startup',
                summary: `Device startup failed for ${entry.displayName}.`,
                blocking: true,
                transcripts: [bootResult.transcript],
            };
        }
        const started = await this._waitForStartableEntry(entry.selectionId, adbPath, 'ios');
        if (!started.ok) {
            return {
                scope: 'startup',
                summary: `Device startup timed out for ${entry.displayName}.`,
                blocking: true,
                transcripts: [bootResult.transcript, ...started.transcripts],
            };
        }
        return null;
    }
    async _startAndroidEmulator(entry, adbPath) {
        if (!adbPath) {
            return {
                scope: 'startup',
                summary: `Device startup failed for ${entry.displayName}.`,
                blocking: true,
                transcripts: [],
            };
        }
        const emulatorPath = await this._resolveAndroidToolPath('emulator', [
            ['emulator', 'emulator'],
        ]);
        if (!emulatorPath) {
            return {
                scope: 'startup',
                summary: 'Device startup failed because the Android emulator binary was not found.',
                blocking: true,
                transcripts: [],
            };
        }
        const args = ['-avd', entry.rawId, '-netdelay', 'none', '-netspeed', 'full'];
        const command = this._formatCommand(emulatorPath, args);
        const stdoutChunks = [];
        const stderrChunks = [];
        let spawnError = null;
        const child = this._spawnFn(emulatorPath, args, {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.stdout?.on('data', (chunk) => {
            stdoutChunks.push(String(chunk));
        });
        child.stderr?.on('data', (chunk) => {
            stderrChunks.push(String(chunk));
        });
        child.once('error', (error) => {
            spawnError = error;
            stderrChunks.push(error.message);
        });
        await this._delayFn(DeviceDiscoveryService.ANDROID_LAUNCH_SETTLE_MS);
        if (spawnError || child.exitCode !== null) {
            return {
                scope: 'startup',
                summary: `Device startup failed for ${entry.displayName}.`,
                blocking: true,
                transcripts: [
                    {
                        command,
                        stdout: stdoutChunks.join(''),
                        stderr: stderrChunks.join(''),
                        exitCode: child.exitCode ?? null,
                    },
                ],
            };
        }
        const started = await this._waitForStartableEntry(entry.selectionId, adbPath, 'android');
        if (started.ok) {
            child.stdout?.destroy();
            child.stderr?.destroy();
            child.unref();
            return null;
        }
        return {
            scope: 'startup',
            summary: `Device startup timed out for ${entry.displayName}.`,
            blocking: true,
            transcripts: [
                {
                    command,
                    stdout: stdoutChunks.join(''),
                    stderr: stderrChunks.join(''),
                    exitCode: child.exitCode ?? null,
                },
                ...started.transcripts,
            ],
        };
    }
    async _waitForStartableEntry(selectionId, adbPath, platform) {
        const deadline = Date.now() + DeviceDiscoveryService.STARTUP_TIMEOUT_MS;
        let lastTranscript = null;
        while (Date.now() < deadline) {
            if (platform === 'android') {
                const probe = await this._probeAndroidConnected(adbPath);
                const match = probe.entries.find((entry) => entry.selectionId === selectionId && entry.runnable);
                if (match?.deviceInfo?.id && adbPath) {
                    const bootResult = await this._runCommand(adbPath, [
                        '-s',
                        match.deviceInfo.id,
                        'shell',
                        'getprop',
                        'sys.boot_completed',
                    ]);
                    lastTranscript = bootResult.transcript;
                    if (bootResult.ok && bootResult.stdout.trim() === '1') {
                        return { ok: true, transcripts: [] };
                    }
                }
                else if (probe.diagnostics.length > 0) {
                    lastTranscript = probe.diagnostics[0]?.transcripts[0] ?? lastTranscript;
                }
            }
            else {
                const probe = await this._probeIOSSimulators();
                const match = probe.entries.find((entry) => entry.selectionId === selectionId && entry.runnable);
                if (match) {
                    return { ok: true, transcripts: [] };
                }
                if (probe.diagnostics.length > 0) {
                    lastTranscript = probe.diagnostics[0]?.transcripts[0] ?? lastTranscript;
                }
            }
            await this._delayFn(DeviceDiscoveryService.POLL_INTERVAL_MS);
        }
        return {
            ok: false,
            transcripts: lastTranscript ? [lastTranscript] : [],
        };
    }
    async _loadAndroidConnectedDetails(adbPath, serial, fallbackModelName) {
        const transcripts = [];
        const sdkResult = await this._runAndroidProperty(adbPath, serial, 'ro.build.version.sdk');
        if (sdkResult.transcript) {
            transcripts.push(sdkResult.transcript);
        }
        const releaseResult = await this._runAndroidProperty(adbPath, serial, 'ro.build.version.release');
        if (releaseResult.transcript) {
            transcripts.push(releaseResult.transcript);
        }
        const modelResult = await this._runAndroidProperty(adbPath, serial, 'ro.product.model');
        if (modelResult.transcript) {
            transcripts.push(modelResult.transcript);
        }
        const qemuResult = await this._runAndroidProperty(adbPath, serial, 'ro.kernel.qemu');
        if (qemuResult.transcript) {
            transcripts.push(qemuResult.transcript);
        }
        const emulator = qemuResult.value === '1' ||
            serial.startsWith('emulator-');
        let avdName = null;
        if (emulator) {
            const avdNameResult = await this._runCommand(adbPath, ['-s', serial, 'emu', 'avd', 'name']);
            transcripts.push(avdNameResult.transcript);
            if (avdNameResult.ok) {
                avdName = this._parseAvdNameOutput(avdNameResult.stdout);
            }
        }
        return {
            modelName: modelResult.value ?? fallbackModelName,
            sdkVersion: parseInt(sdkResult.value ?? '', 10) || 0,
            releaseVersion: releaseResult.value,
            emulator,
            avdName,
            transcripts,
        };
    }
    async _loadAvdManagerRecords(diagnostics) {
        const avdManagerPath = await this._resolveAndroidToolPath('avdmanager', [
            ['cmdline-tools', 'latest', 'bin', 'avdmanager'],
            ['cmdline-tools', 'bin', 'avdmanager'],
            ['tools', 'bin', 'avdmanager'],
        ]);
        if (!avdManagerPath) {
            return new Map();
        }
        const result = await this._runCommand(avdManagerPath, ['list', 'avd']);
        if (!result.ok) {
            diagnostics.push({
                scope: 'android-targets',
                summary: 'Android AVD metadata lookup failed.',
                blocking: false,
                transcripts: [result.transcript],
            });
            return new Map();
        }
        return this._parseAvdManagerList(result.stdout);
    }
    async _loadAvdMetadata(name, avdRecords) {
        const configuredPath = avdRecords.get(name)?.path;
        const configDir = configuredPath ?? path.join(this._getAvdHome(), `${name}.avd`);
        const configPath = path.join(configDir, 'config.ini');
        if (!this._fileExistsFn(configPath)) {
            return {
                name,
                configDir: this._fileExistsFn(configDir) ? configDir : null,
                modelName: null,
                osVersionLabel: null,
            };
        }
        let rawConfig = '';
        try {
            rawConfig = await this._readFileFn(configPath, 'utf-8');
        }
        catch {
            return {
                name,
                configDir,
                modelName: null,
                osVersionLabel: null,
            };
        }
        const values = this._parseIni(rawConfig);
        const modelName = this._normalizeLabel(values['avd.ini.displayname']) ??
            this._normalizeLabel(values['hw.device.name']);
        const imageSysDir = values['image.sysdir.1'] ??
            values['image.sysdir.2'] ??
            values['target'];
        const apiMatch = imageSysDir?.match(/android-(\d+)/i);
        const osVersionLabel = apiMatch ? `Android API ${apiMatch[1]}` : null;
        return {
            name,
            configDir,
            modelName,
            osVersionLabel,
        };
    }
    async _runAndroidProperty(adbPath, serial, property) {
        const result = await this._runCommand(adbPath, ['-s', serial, 'shell', 'getprop', property]);
        return {
            value: result.ok ? result.stdout.trim() || null : null,
            transcript: result.transcript,
        };
    }
    async _runCommand(file, args) {
        try {
            const { stdout, stderr } = await this._execFileFn(file, args);
            return {
                ok: true,
                stdout: stdout.toString(),
                stderr: stderr.toString(),
                transcript: {
                    command: this._formatCommand(file, args),
                    stdout: stdout.toString(),
                    stderr: stderr.toString(),
                    exitCode: 0,
                },
            };
        }
        catch (error) {
            const stdout = typeof error.stdout === 'string' ||
                Buffer.isBuffer(error.stdout)
                ? error.stdout.toString()
                : '';
            const stderr = typeof error.stderr === 'string' ||
                Buffer.isBuffer(error.stderr)
                ? error.stderr.toString()
                : '';
            const exitCode = typeof error.code === 'number'
                ? error.code ?? null
                : null;
            return {
                ok: false,
                stdout,
                stderr,
                transcript: {
                    command: this._formatCommand(file, args),
                    stdout,
                    stderr,
                    exitCode,
                },
            };
        }
    }
    async _resolveAndroidToolPath(commandName, sdkRelativePaths) {
        const sdkRoot = this._env['ANDROID_HOME'] ?? this._env['ANDROID_SDK_ROOT'];
        if (sdkRoot) {
            for (const parts of sdkRelativePaths) {
                const candidate = path.join(sdkRoot, ...parts);
                if (this._fileExistsFn(candidate)) {
                    return candidate;
                }
            }
        }
        const result = await this._runCommand('which', [commandName]);
        if (!result.ok) {
            return null;
        }
        const resolved = result.stdout.trim();
        return resolved.length > 0 && this._fileExistsFn(resolved) ? resolved : null;
    }
    _parseAvdManagerList(output) {
        const result = new Map();
        const sections = output.split(/(?:\r?\n){2,}/);
        for (const section of sections) {
            const lines = section.split(/\r?\n/);
            let name = null;
            let recordPath = null;
            for (const rawLine of lines) {
                const line = rawLine.trim();
                const nameMatch = line.match(/^Name:\s*(.+)$/i);
                if (nameMatch) {
                    name = nameMatch[1]?.trim() ?? null;
                    continue;
                }
                const pathMatch = line.match(/^Path:\s*(.+)$/i);
                if (pathMatch) {
                    recordPath = pathMatch[1]?.trim() ?? null;
                }
            }
            if (name) {
                result.set(name, { name, path: recordPath });
            }
        }
        return result;
    }
    _parseIni(rawConfig) {
        const values = {};
        for (const rawLine of rawConfig.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) {
                continue;
            }
            const separatorIndex = line.indexOf('=');
            if (separatorIndex === -1) {
                continue;
            }
            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim();
            if (key) {
                values[key] = value;
            }
        }
        return values;
    }
    _parseIOSRuntimeLabel(runtime) {
        const match = runtime.match(/iOS-(\d+)(?:-(\d+))?/i);
        if (!match) {
            return null;
        }
        const major = parseInt(match[1] ?? '', 10) || 0;
        const minor = match[2] ? parseInt(match[2], 10) : null;
        return {
            label: minor !== null ? `iOS ${major}.${minor}` : `iOS ${major}`,
            sdkVersion: major,
        };
    }
    _parseInlineAdbField(line, fieldName) {
        const match = line.match(new RegExp(`${fieldName}:([^\\s]+)`));
        return this._normalizeLabel(match?.[1] ?? null);
    }
    _parseAdbDeviceLine(line) {
        const match = line.match(/^(\S+)\s+(.+)$/);
        if (!match) {
            return null;
        }
        const serial = match[1]?.trim();
        const remainder = match[2]?.trim();
        if (!serial || !remainder) {
            return null;
        }
        for (const knownState of ['device', 'offline', 'unauthorized']) {
            if (remainder === knownState || remainder.startsWith(`${knownState} `)) {
                return { serial, state: knownState };
            }
        }
        const markers = [
            ' product:',
            ' model:',
            ' device:',
            ' transport_id:',
            ' usb:',
            ' features:',
        ];
        const markerIndex = markers
            .map((marker) => remainder.indexOf(marker))
            .filter((index) => index >= 0)
            .reduce((smallest, index) => Math.min(smallest, index), Number.POSITIVE_INFINITY);
        const state = (markerIndex === Number.POSITIVE_INFINITY
            ? remainder
            : remainder.slice(0, markerIndex)).trim();
        return state.length > 0 ? { serial, state } : null;
    }
    _parseAvdNameOutput(output) {
        const line = output
            .split(/\r?\n/)
            .map((part) => part.trim())
            .find((part) => part.length > 0 && part.toUpperCase() !== 'OK');
        return line && line.length > 0 ? line : null;
    }
    _normalizeLabel(value) {
        if (!value) {
            return null;
        }
        const normalized = value.replace(/_/g, ' ').trim();
        return normalized.length > 0 ? normalized : null;
    }
    _formatAndroidOsLabel(params) {
        if (params.releaseVersion) {
            return `Android ${params.releaseVersion}`;
        }
        if (params.sdkVersion > 0) {
            return `Android API ${params.sdkVersion}`;
        }
        return null;
    }
    _formatAndroidDisplayName(params) {
        const parts = [params.modelName ?? 'Android target'];
        if (params.osVersionLabel) {
            parts.push(params.osVersionLabel);
        }
        parts.push(params.id);
        return parts.join(' - ');
    }
    _formatIOSDisplayName(name, runtimeLabel, udid) {
        const parts = [name];
        if (runtimeLabel) {
            parts.push(runtimeLabel);
        }
        parts.push(udid);
        return parts.join(' - ');
    }
    _formatCommand(file, args) {
        return [file, ...args].join(' ');
    }
    _getAvdHome() {
        return this._env['ANDROID_AVD_HOME'] ?? path.join(this._homeDir, '.android', 'avd');
    }
}
exports.DeviceDiscoveryService = DeviceDiscoveryService;
//# sourceMappingURL=DeviceDiscoveryService.js.map