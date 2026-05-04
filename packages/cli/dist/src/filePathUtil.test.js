"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const node_test_1 = __importDefault(require("node:test"));
const filePathUtil_js_1 = require("./filePathUtil.js");
function createTempResourceDir() {
    const root = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-cli-'));
    node_fs_1.default.mkdirSync(node_path_1.default.join(root, 'ios'), { recursive: true });
    node_fs_1.default.writeFileSync(node_path_1.default.join(root, 'ios', 'usb-ui-test-ios.zip'), 'zip');
    node_fs_1.default.writeFileSync(node_path_1.default.join(root, 'ios', 'usb-ui-test-ios-test-Runner.zip'), 'zip');
    return root;
}
(0, node_test_1.default)('CliFilePathUtil extracts both iOS driver archives into Debug-iphonesimulator', async () => {
    const resourceDir = createTempResourceDir();
    const unzipCalls = [];
    try {
        const filePathUtil = new filePathUtil_js_1.CliFilePathUtil(resourceDir, (async (_file, args) => {
            unzipCalls.push(args);
            const zipPath = args[1];
            const targetDir = args[3];
            if (zipPath.endsWith('usb-ui-test-ios-test-Runner.zip')) {
                node_fs_1.default.mkdirSync(node_path_1.default.join(targetDir, 'usb-ui-test-ios-test-Runner.app'), {
                    recursive: true,
                });
            }
            else if (zipPath.endsWith('usb-ui-test-ios.zip')) {
                node_fs_1.default.mkdirSync(node_path_1.default.join(targetDir, 'usb-ui-test-ios.app'), {
                    recursive: true,
                });
            }
            return { stdout: '', stderr: '' };
        }));
        const runnerPath = await filePathUtil.getIOSDriverAppPath();
        strict_1.default.equal(runnerPath, node_path_1.default.join(resourceDir, 'ios', 'Debug-iphonesimulator', 'usb-ui-test-ios-test-Runner.app'));
        strict_1.default.equal(unzipCalls.length, 2);
        strict_1.default.deepEqual(unzipCalls.map((args) => node_path_1.default.basename(args[1])), ['usb-ui-test-ios.zip', 'usb-ui-test-ios-test-Runner.zip']);
    }
    finally {
        node_fs_1.default.rmSync(resourceDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('CliFilePathUtil fails clearly when an iOS archive cannot be unzipped', async () => {
    const resourceDir = createTempResourceDir();
    try {
        const filePathUtil = new filePathUtil_js_1.CliFilePathUtil(resourceDir, (async (_file, args) => {
            throw new Error(`unzip failed for ${node_path_1.default.basename(args[1])}`);
        }));
        await strict_1.default.rejects(() => filePathUtil.ensureIOSAppsAvailable(), /Failed to unzip iOS driver archive/);
    }
    finally {
        node_fs_1.default.rmSync(resourceDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('CliFilePathUtil reuses pre-extracted iOS driver apps without unzipping again', async () => {
    const resourceDir = createTempResourceDir();
    const targetDir = node_path_1.default.join(resourceDir, 'ios', 'Debug-iphonesimulator');
    node_fs_1.default.mkdirSync(node_path_1.default.join(targetDir, 'usb-ui-test-ios.app'), { recursive: true });
    node_fs_1.default.mkdirSync(node_path_1.default.join(targetDir, 'usb-ui-test-ios-test-Runner.app'), { recursive: true });
    let unzipCalled = false;
    try {
        const filePathUtil = new filePathUtil_js_1.CliFilePathUtil(resourceDir, (async () => {
            unzipCalled = true;
            return { stdout: '', stderr: '' };
        }));
        const runnerPath = await filePathUtil.getIOSDriverAppPath();
        strict_1.default.equal(runnerPath, node_path_1.default.join(resourceDir, 'ios', 'Debug-iphonesimulator', 'usb-ui-test-ios-test-Runner.app'));
        strict_1.default.equal(unzipCalled, false);
    }
    finally {
        node_fs_1.default.rmSync(resourceDir, { recursive: true, force: true });
    }
});
(0, node_test_1.default)('CliFilePathUtil downloads the Android driver asset from the manifest into the cache dir', async () => {
    const cacheDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-assets-cache-'));
    const sourceDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'usb-ui-test-assets-source-'));
    const previousManifestPath = process.env['USB_UI_TEST_ASSET_MANIFEST_PATH'];
    try {
        const assetContents = Buffer.from('apk-binary');
        const assetPath = node_path_1.default.join(sourceDir, 'app-debug.apk');
        node_fs_1.default.writeFileSync(assetPath, assetContents);
        const manifestPath = node_path_1.default.join(sourceDir, 'assets-manifest.json');
        node_fs_1.default.writeFileSync(manifestPath, JSON.stringify({
            version: '0.1.1',
            assets: [
                {
                    kind: 'android-driver-apk',
                    platform: 'android',
                    filename: 'app-debug.apk',
                    url: `file://${assetPath}`,
                    sha256: (0, node_crypto_1.createHash)('sha256').update(assetContents).digest('hex'),
                    size: assetContents.length,
                },
            ],
        }), 'utf-8');
        process.env['USB_UI_TEST_ASSET_MANIFEST_PATH'] = manifestPath;
        const filePathUtil = new filePathUtil_js_1.CliFilePathUtil(cacheDir, undefined, { downloadAssets: true });
        const resolvedAssetPath = await filePathUtil.getDriverAppPath();
        strict_1.default.equal(resolvedAssetPath, node_path_1.default.join(cacheDir, 'android', 'app-debug.apk'));
        strict_1.default.equal(node_fs_1.default.readFileSync(resolvedAssetPath, 'utf-8'), 'apk-binary');
    }
    finally {
        if (previousManifestPath === undefined) {
            delete process.env['USB_UI_TEST_ASSET_MANIFEST_PATH'];
        }
        else {
            process.env['USB_UI_TEST_ASSET_MANIFEST_PATH'] = previousManifestPath;
        }
        node_fs_1.default.rmSync(cacheDir, { recursive: true, force: true });
        node_fs_1.default.rmSync(sourceDir, { recursive: true, force: true });
    }
});
//# sourceMappingURL=filePathUtil.test.js.map