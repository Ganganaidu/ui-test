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
exports.LocalRuntimeMissingError = void 0;
exports.resolveLocalRuntimeRoot = resolveLocalRuntimeRoot;
exports.resolveLocalRuntime = resolveLocalRuntime;
exports.isInteractive = isInteractive;
// Resolver for the "local runtime" — the heavyweight modules (test runner,
// device drivers, doctor, report server) that local commands need.
//
// In dev / npm installs the heavy modules ship inside packages/cli/, so a
// dynamic import resolves them from the local node_modules. In the
// Bun-compiled binary distribution they're bundled into the binary itself,
// but the binary still needs the on-disk runtime tarball (driver APKs, iOS
// zips, gRPC proto, Vite SPA dist) at ~/.usb-ui-test/runtime/<version>/. We
// gate local-command execution on that tarball being present and surface
// LocalRuntimeMissingError with recovery instructions if it isn't.
//
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const runtimePaths_js_1 = require("./runtimePaths.js");
const isStandaloneBinary = typeof USB_UI_TEST_IS_STANDALONE_BINARY !== 'undefined' &&
    USB_UI_TEST_IS_STANDALONE_BINARY === 'true';
const INSTALL_URL = 'https://raw.githubusercontent.com/gangadharkondati/usb-ui-test/main/scripts/install.sh';
class LocalRuntimeMissingError extends Error {
    exitCode = 1;
    cliVersion;
    runtimeRoot;
    constructor(cliVersion, runtimeRoot) {
        super(buildMessage(cliVersion, runtimeRoot));
        this.name = 'LocalRuntimeMissingError';
        this.cliVersion = cliVersion;
        this.runtimeRoot = runtimeRoot;
    }
}
exports.LocalRuntimeMissingError = LocalRuntimeMissingError;
function buildMessage(cliVersion, runtimeRoot) {
    return [
        '',
        '\x1b[31m✖ Local runtime not installed.\x1b[0m',
        '',
        '  This command needs the local test runtime (driver bundles, AI SDKs,',
        '  device control, report server). Install it by re-running:',
        '',
        `    curl -fsSL ${INSTALL_URL} | bash`,
        `  (Looked for runtime ${cliVersion} at ${runtimeRoot})`,
        '',
    ].join('\n');
}
function resolveLocalRuntimeRoot() {
    // Explicit override wins.
    const override = process.env['USB_UI_TEST_RUNTIME_ROOT'];
    if (override && override.trim()) {
        return path.resolve(override.trim());
    }
    // Honor the same USB_UI_TEST_DIR convention the install script uses, so a
    // user who installed via `USB_UI_TEST_DIR=/opt/usb-ui-test ... bash` can find
    // their runtime at /opt/usb-ui-test/runtime/<version>/.
    const usbUiTestDir = process.env['USB_UI_TEST_DIR']?.trim() || path.join(os.homedir(), '.usb-ui-test');
    return path.join(usbUiTestDir, 'runtime', (0, runtimePaths_js_1.resolveCliPackageVersion)());
}
/**
 * Lazy-load the local-runtime modules. Local commands await it before
 * running their handlers.
 *
 * In a Bun-compiled standalone binary the heavy JS is bundled into the
 * executable but the on-disk assets (driver bundles, gRPC proto, SPA dist)
 * live in the runtime tarball — we require it to be installed and throw
 * LocalRuntimeMissingError with recovery instructions otherwise.
 *
 * In dev / tsc / npm installs the resolver always succeeds because the
 * heavy modules ship in packages/cli's node_modules tree.
 */
async function resolveLocalRuntime() {
    const runtimeRoot = resolveLocalRuntimeRoot();
    if (isStandaloneBinary) {
        if (!fs.existsSync(path.join(runtimeRoot, 'manifest.json'))) {
            throw new LocalRuntimeMissingError((0, runtimePaths_js_1.resolveCliPackageVersion)(), runtimeRoot);
        }
    }
    const [testRunner, doctorRunner, reportServer, reportServerManager] = await Promise.all([
        import('./testRunner.js'),
        import('./doctorRunner.js'),
        import('./reportServer.js'),
        import('./reportServerManager.js'),
    ]);
    return { testRunner, doctorRunner, reportServer, reportServerManager };
}
/**
 * Heuristic for whether the current process can prompt the user. Used by
 * any code path that wants to ask before doing something heavy (e.g.
 * downloading the runtime tarball). False in CI and any non-TTY context.
 */
function isInteractive() {
    if (process.env['CI'])
        return false;
    if (process.env['USB_UI_TEST_NON_INTERACTIVE'])
        return false;
    return Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}
//# sourceMappingURL=localRuntime.js.map