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
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { resolveCliPackageVersion } from './runtimePaths.js';

// Set to "true" by `bun build --define` in scripts/build-binary.sh. Undefined
// in dev and tsc-compiled builds. We use this rather than process.versions.bun
// because contributors who run `bun run` for dev iteration would otherwise
// hit the standalone-binary code path even when the runtime tarball isn't
// installed.
declare const USB_UI_TEST_IS_STANDALONE_BINARY: string | undefined;
const isStandaloneBinary: boolean =
  typeof USB_UI_TEST_IS_STANDALONE_BINARY !== 'undefined' &&
  USB_UI_TEST_IS_STANDALONE_BINARY === 'true';

const INSTALL_URL =
  'https://raw.githubusercontent.com/gangadharkondati/usb-ui-test/main/scripts/install.sh';

export class LocalRuntimeMissingError extends Error {
  readonly exitCode = 1;
  readonly cliVersion: string;
  readonly runtimeRoot: string;

  constructor(cliVersion: string, runtimeRoot: string) {
    super(buildMessage(cliVersion, runtimeRoot));
    this.name = 'LocalRuntimeMissingError';
    this.cliVersion = cliVersion;
    this.runtimeRoot = runtimeRoot;
  }
}

function buildMessage(cliVersion: string, runtimeRoot: string): string {
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

export interface LocalRuntime {
  testRunner: typeof import('./testRunner.js');
  doctorRunner: typeof import('./doctorRunner.js');
  reportServer: typeof import('./reportServer.js');
  reportServerManager: typeof import('./reportServerManager.js');
}

export function resolveLocalRuntimeRoot(): string {
  // Explicit override wins.
  const override = process.env['USB_UI_TEST_RUNTIME_ROOT'];
  if (override && override.trim()) {
    return path.resolve(override.trim());
  }
  // Honor the same USB_UI_TEST_DIR convention the install script uses, so a
  // user who installed via `USB_UI_TEST_DIR=/opt/usb-ui-test ... bash` can find
  // their runtime at /opt/usb-ui-test/runtime/<version>/.
  const usbUiTestDir = process.env['USB_UI_TEST_DIR']?.trim() || path.join(os.homedir(), '.usb-ui-test');
  return path.join(usbUiTestDir, 'runtime', resolveCliPackageVersion());
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
export async function resolveLocalRuntime(): Promise<LocalRuntime> {
  const runtimeRoot = resolveLocalRuntimeRoot();

  if (isStandaloneBinary) {
    if (!fs.existsSync(path.join(runtimeRoot, 'manifest.json'))) {
      throw new LocalRuntimeMissingError(resolveCliPackageVersion(), runtimeRoot);
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
export function isInteractive(): boolean {
  if (process.env['CI']) return false;
  if (process.env['USB_UI_TEST_NON_INTERACTIVE']) return false;
  return Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}
