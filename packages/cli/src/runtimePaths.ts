import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// Read the CLI version from the package.json that sits next to this source
// file. Under tsc-Node16 the file compiles to CJS so `require` is the global
// loader; under Bun's compile pipeline the JSON is bundled into the
// executable. Either way the version is available without walking the
// build-machine __dirname at runtime (which doesn't exist on the deploy
// machine for Bun-compiled binaries).
//
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cliPackageJson: { version?: string } = require('../package.json');
const BUNDLED_CLI_VERSION: string = cliPackageJson.version ?? '0.0.0';

interface UsbUiTestPackageJson {
  name?: string;
  version?: string;
  bin?: Record<string, string>;
}

function readJsonFile(filePath: string): UsbUiTestPackageJson | undefined {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as UsbUiTestPackageJson;
  } catch {
    return undefined;
  }
}

function isCliPackageJson(packageJson: UsbUiTestPackageJson | undefined): boolean {
  return packageJson?.name === 'usb-ui-test' ||
    packageJson?.name === '@usb-ui-test/cli' ||
    packageJson?.bin?.['usb-ui-test'] !== undefined;
}

function findCliPackageRoot(startDir: string): string {
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

export function resolveCliPackageRoot(startDir: string = __dirname): string {
  return findCliPackageRoot(startDir);
}

export function resolveCliPackageVersion(_startDir: string = __dirname): string {
  // Always return the version inlined at build time. We previously walked up
  // from __dirname looking for a package.json, but in a Bun-compiled binary
  // __dirname is the source path on the build machine and doesn't exist on
  // the deploy machine, causing a fatal startup error.
  return BUNDLED_CLI_VERSION;
}

export function resolveUsbUiTestRootDir(): string {
  return path.join(os.homedir(), '.usb-ui-test');
}

export function resolveCliCacheRoot(startDir: string = __dirname): string {
  const overrideRoot = process.env['USB_UI_TEST_CACHE_DIR'];
  if (overrideRoot && overrideRoot.trim()) {
    return path.resolve(overrideRoot, resolveCliPackageVersion(startDir));
  }

  return path.join(resolveUsbUiTestRootDir(), 'assets', resolveCliPackageVersion(startDir));
}

export function resolveCliLaunchArgs(
  args: readonly string[],
  startDir: string = __dirname,
): string[] {
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

export function initializeCliRuntimeEnvironment(startDir: string = __dirname): void {
  // Look for the local-runtime tarball install location first. When the CLI
  // is running as a Bun-compiled binary, all on-disk assets (driver APKs,
  // gRPC proto, Vite SPA dist) live there rather than next to the binary.
  const runtimeRoot = resolveLocalRuntimeRoot();

  if (!process.env['USB_UI_TEST_DRIVER_PROTO_PATH']) {
    const candidates: string[] = [];
    if (runtimeRoot) {
      candidates.push(path.join(runtimeRoot, 'proto', 'usbuitest', 'driver.proto'));
    }
    try {
      const packageRoot = resolveCliPackageRoot(startDir);
      candidates.push(
        path.join(packageRoot, 'proto', 'usbuitest', 'driver.proto'),
        path.resolve(packageRoot, '../../proto/usbuitest/driver.proto'),
        path.resolve(packageRoot, '../proto/usbuitest/driver.proto'),
      );
    } catch {
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

function resolveLocalRuntimeRoot(): string | undefined {
  const override = process.env['USB_UI_TEST_RUNTIME_ROOT'];
  if (override && override.trim()) {
    const candidate = path.resolve(override.trim());
    if (fs.existsSync(path.join(candidate, 'manifest.json'))) {
      return candidate;
    }
  }
  // Honor USB_UI_TEST_DIR so the binary finds the runtime when the user
  // installed via `USB_UI_TEST_DIR=... bash install.sh` to a custom location.
  const usbUiTestDir =
    process.env['USB_UI_TEST_DIR']?.trim() || path.join(os.homedir(), '.usb-ui-test');
  const versioned = path.join(usbUiTestDir, 'runtime', resolveCliPackageVersion());
  if (fs.existsSync(path.join(versioned, 'manifest.json'))) {
    return versioned;
  }
  return undefined;
}
