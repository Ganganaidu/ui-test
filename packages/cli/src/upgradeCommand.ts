// `usb-ui-test upgrade` — self-update by re-running the install script.
//
// We don't reimplement the install logic here; the script at
// scripts/install.sh handles binary download, PATH wiring, and
// (interactively) the runtime tarball + host tools. This subcommand
// just spawns it.

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { resolveCliPackageVersion } from './runtimePaths.js';

const INSTALL_URL =
  'https://raw.githubusercontent.com/gangadharkondati/usb-ui-test/main/scripts/install.sh';

export interface UpgradeOptions {
  version?: string;
  /** Pass --ci to the installer (binary only, skip runtime tarball + prompts). */
  ci?: boolean;
}

export async function runUpgrade(options: UpgradeOptions): Promise<void> {
  // Mode detection: if the user explicitly passed --ci, honor it. Otherwise,
  // mirror the user's previous install footprint — if they don't have the
  // runtime tarball installed today, they probably want a binary-only
  // upgrade too. If they DO have the runtime tarball, we want the installer
  // to refresh it (default, no --ci flag).
  let useCiFlag = options.ci === true;
  if (!useCiFlag && !hasInstalledRuntime()) {
    useCiFlag = true;
  }

  const targetLabel = options.version ? `v${options.version}` : 'latest';
  const modeLabel = useCiFlag ? 'binary-only (--ci)' : 'full setup';
  console.log(`Upgrading usb-ui-test to ${targetLabel} (${modeLabel})...`);
  console.log('');

  // Strip USB_UI_TEST_* env vars from the inherited environment before spawning
  // the installer. The current process may have been started with debugging
  // overrides (USB_UI_TEST_RUNTIME_ROOT, USB_UI_TEST_ASSET_DIR,
  // USB_UI_TEST_CACHE_DIR, etc.) — those are runtime concerns for THIS binary
  // and shouldn't influence where the installer puts the next version.
  // USB_UI_TEST_DIR is the one knob users intentionally pin install location
  // with, so we preserve it. USB_UI_TEST_VERSION we set explicitly when --version
  // was passed; otherwise we drop it so the installer resolves "latest".
  const preservedDir = process.env['USB_UI_TEST_DIR'];
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('USB_UI_TEST_')) {
      env[key] = value;
    }
  }
  if (preservedDir) env['USB_UI_TEST_DIR'] = preservedDir;
  if (options.version) env['USB_UI_TEST_VERSION'] = options.version;

  // curl -fsSL <url> | bash [-s -- --ci]
  // Implemented as `bash -c` so the pipe stays correctly inside one shell.
  const flagPart = useCiFlag ? ' -s -- --ci' : '';
  const command = `curl -fsSL ${INSTALL_URL} | bash${flagPart}`;

  await new Promise<void>((resolve, reject) => {
    const child = spawn('bash', ['-c', command], {
      stdio: 'inherit',
      env,
    });
    child.on('error', (e) => reject(e));
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Installer terminated by signal ${signal}`));
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Installer exited with code ${code}`));
    });
  });
}

function hasInstalledRuntime(): boolean {
  const version = resolveCliPackageVersion();
  const explicit = process.env['USB_UI_TEST_RUNTIME_ROOT']?.trim();
  if (explicit) {
    return fs.existsSync(path.join(explicit, 'manifest.json'));
  }
  const usbUiTestDir = process.env['USB_UI_TEST_DIR']?.trim() || path.join(os.homedir(), '.usb-ui-test');
  return fs.existsSync(path.join(usbUiTestDir, 'runtime', version, 'manifest.json'));
}
