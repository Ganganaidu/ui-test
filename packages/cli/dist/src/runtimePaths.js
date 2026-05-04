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
exports.resolveCliPackageRoot = resolveCliPackageRoot;
exports.resolveCliPackageVersion = resolveCliPackageVersion;
exports.resolveUsbUiTestRootDir = resolveUsbUiTestRootDir;
exports.resolveCliCacheRoot = resolveCliCacheRoot;
exports.resolveCliLaunchArgs = resolveCliLaunchArgs;
exports.initializeCliRuntimeEnvironment = initializeCliRuntimeEnvironment;
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
// Read the CLI version from the package.json that sits next to this source
// file. Under tsc-Node16 the file compiles to CJS so `require` is the global
// loader; under Bun's compile pipeline the JSON is bundled into the
// executable. Either way the version is available without walking the
// build-machine __dirname at runtime (which doesn't exist on the deploy
// machine for Bun-compiled binaries).
//
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cliPackageJson = require('../package.json');
const BUNDLED_CLI_VERSION = cliPackageJson.version ?? '0.0.0';
function readJsonFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    catch {
        return undefined;
    }
}
function isCliPackageJson(packageJson) {
    return packageJson?.name === 'usb-ui-test' ||
        packageJson?.name === '@usb-ui-test/cli' ||
        packageJson?.bin?.['usb-ui-test'] !== undefined;
}
function findCliPackageRoot(startDir) {
    let currentDir = path.resolve(startDir);
    while (true) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (fs.existsSync(packageJsonPath) && isCliPackageJson(readJsonFile(packageJsonPath))) {
            return currentDir;
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            throw new Error(`Could not find the UsbUiTest CLI package root from ${startDir}`);
        }
        currentDir = parentDir;
    }
}
function resolveCliPackageRoot(startDir = __dirname) {
    return findCliPackageRoot(startDir);
}
function resolveCliPackageVersion(_startDir = __dirname) {
    // Always return the version inlined at build time. We previously walked up
    // from __dirname looking for a package.json, but in a Bun-compiled binary
    // __dirname is the source path on the build machine and doesn't exist on
    // the deploy machine, causing a fatal startup error.
    return BUNDLED_CLI_VERSION;
}
function resolveUsbUiTestRootDir() {
    return path.join(os.homedir(), '.usb-ui-test');
}
function resolveCliCacheRoot(startDir = __dirname) {
    const overrideRoot = process.env['USB_UI_TEST_CACHE_DIR'];
    if (overrideRoot && overrideRoot.trim()) {
        return path.resolve(overrideRoot, resolveCliPackageVersion(startDir));
    }
    return path.join(resolveUsbUiTestRootDir(), 'assets', resolveCliPackageVersion(startDir));
}
function resolveCliLaunchArgs(args, startDir = __dirname) {
    const compiledBinPath = path.resolve(startDir, '../bin/usb-ui-test.js');
    if (fs.existsSync(compiledBinPath)) {
        return [compiledBinPath, ...args];
    }
    const sourceBinCandidates = [
        path.resolve(startDir, '../bin/usb-ui-test.ts'),
        path.resolve(startDir, '../../bin/usb-ui-test.ts'),
    ];
    const tsxCliCandidates = [
        path.resolve(startDir, '../../../node_modules/tsx/dist/cli.mjs'),
        path.resolve(startDir, '../../../../node_modules/tsx/dist/cli.mjs'),
    ];
    const tsconfigCandidates = [
        path.resolve(startDir, '../../../tsconfig.dev.json'),
        path.resolve(startDir, '../../../../tsconfig.dev.json'),
    ];
    const sourceBinPath = sourceBinCandidates.find((candidate) => fs.existsSync(candidate));
    const tsxCliPath = tsxCliCandidates.find((candidate) => fs.existsSync(candidate));
    const tsconfigPath = tsconfigCandidates.find((candidate) => fs.existsSync(candidate));
    if (sourceBinPath && tsxCliPath) {
        return tsconfigPath
            ? [tsxCliPath, '--tsconfig', tsconfigPath, sourceBinPath, ...args]
            : [tsxCliPath, sourceBinPath, ...args];
    }
    throw new Error('Could not resolve a UsbUiTest CLI entrypoint for background report server startup.');
}
function initializeCliRuntimeEnvironment(startDir = __dirname) {
    // Look for the local-runtime tarball install location first. When the CLI
    // is running as a Bun-compiled binary, all on-disk assets (driver APKs,
    // gRPC proto, Vite SPA dist) live there rather than next to the binary.
    const runtimeRoot = resolveLocalRuntimeRoot();
    if (!process.env['USB_UI_TEST_DRIVER_PROTO_PATH']) {
        const candidates = [];
        if (runtimeRoot) {
            candidates.push(path.join(runtimeRoot, 'proto', 'usbuitest', 'driver.proto'));
        }
        try {
            const packageRoot = resolveCliPackageRoot(startDir);
            candidates.push(path.join(packageRoot, 'proto', 'usbuitest', 'driver.proto'), path.resolve(packageRoot, '../../proto/usbuitest/driver.proto'), path.resolve(packageRoot, '../proto/usbuitest/driver.proto'));
        }
        catch {
            // No CLI package root resolvable — happens inside Bun-compiled binaries.
            // Fall back to runtime-tarball location only.
        }
        const resolvedProtoPath = candidates.find((candidate) => fs.existsSync(candidate));
        if (resolvedProtoPath) {
            process.env['USB_UI_TEST_DRIVER_PROTO_PATH'] = resolvedProtoPath;
        }
    }
    if (!process.env['USB_UI_TEST_ASSET_DIR'] && runtimeRoot) {
        const installResources = path.join(runtimeRoot, 'install-resources');
        if (fs.existsSync(installResources)) {
            process.env['USB_UI_TEST_ASSET_DIR'] = installResources;
        }
    }
    if (!process.env['USB_UI_TEST_REPORT_APP_DIR'] && runtimeRoot) {
        const reportApp = path.join(runtimeRoot, 'report-app');
        if (fs.existsSync(reportApp)) {
            process.env['USB_UI_TEST_REPORT_APP_DIR'] = reportApp;
        }
    }
}
function resolveLocalRuntimeRoot() {
    const override = process.env['USB_UI_TEST_RUNTIME_ROOT'];
    if (override && override.trim()) {
        const candidate = path.resolve(override.trim());
        if (fs.existsSync(path.join(candidate, 'manifest.json'))) {
            return candidate;
        }
    }
    // Honor USB_UI_TEST_DIR so the binary finds the runtime when the user
    // installed via `USB_UI_TEST_DIR=... bash install.sh` to a custom location.
    const usbUiTestDir = process.env['USB_UI_TEST_DIR']?.trim() || path.join(os.homedir(), '.usb-ui-test');
    const versioned = path.join(usbUiTestDir, 'runtime', resolveCliPackageVersion());
    if (fs.existsSync(path.join(versioned, 'manifest.json'))) {
        return versioned;
    }
    return undefined;
}
//# sourceMappingURL=runtimePaths.js.map