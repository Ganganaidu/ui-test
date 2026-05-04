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
exports.RuntimeAssetStore = void 0;
const crypto = __importStar(require("node:crypto"));
const fs = __importStar(require("node:fs"));
const fsp = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_url_1 = require("node:url");
const runtimePaths_js_1 = require("./runtimePaths.js");
function resolveLocalResourceDir(startDir = __dirname) {
    const envDir = process.env['USB_UI_TEST_ASSET_DIR'];
    if (envDir && envDir.trim()) {
        return path.resolve(envDir);
    }
    const candidates = [
        path.resolve(startDir, '../../../resources'),
        path.resolve(startDir, '../../../../resources'),
        path.resolve(startDir, '../../resources'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate));
}
function relativePathForAssetKind(kind) {
    switch (kind) {
        case 'android-driver-apk':
            return path.join('android', 'app-debug.apk');
        case 'android-driver-test-apk':
            return path.join('android', 'app-debug-androidTest.apk');
        case 'ios-driver-archive':
            return path.join('ios', 'usb-ui-test-ios.zip');
        case 'ios-driver-runner-archive':
            return path.join('ios', 'usb-ui-test-ios-test-Runner.zip');
    }
}
function sha256Hex(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}
class RuntimeAssetStore {
    _resourceDir;
    _downloadAssets;
    _manifestPromise = null;
    constructor(resourceDir, options) {
        this._resourceDir = resourceDir
            ? path.resolve(resourceDir)
            : resolveLocalResourceDir() ?? (0, runtimePaths_js_1.resolveCliCacheRoot)();
        this._downloadAssets = options?.downloadAssets === true;
    }
    getResourceDir() {
        return this._resourceDir;
    }
    async resolveAssetPath(kind) {
        const directPath = path.join(this._resourceDir, relativePathForAssetKind(kind));
        if (fs.existsSync(directPath)) {
            return directPath;
        }
        if (!this._downloadAssets) {
            return null;
        }
        const manifest = await this._loadManifest();
        const asset = manifest?.assets.find((entry) => entry.kind === kind);
        if (!asset) {
            return null;
        }
        const destinationPath = path.join(this._resourceDir, asset.relativePath ?? relativePathForAssetKind(kind));
        if (await this._isValidAssetFile(destinationPath, asset)) {
            return destinationPath;
        }
        await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
        const downloaded = await this._readAssetBytes(asset.url);
        const downloadedHash = sha256Hex(downloaded);
        if (downloaded.length !== asset.size) {
            throw new Error(`Downloaded UsbUiTest asset ${asset.filename} has size ${downloaded.length}, expected ${asset.size}.`);
        }
        if (downloadedHash !== asset.sha256.toLowerCase()) {
            throw new Error(`Downloaded UsbUiTest asset ${asset.filename} failed checksum verification.`);
        }
        const tempPath = `${destinationPath}.download-${process.pid}-${Date.now()}`;
        await fsp.writeFile(tempPath, downloaded);
        await fsp.rename(tempPath, destinationPath);
        return destinationPath;
    }
    async _loadManifest() {
        if (this._manifestPromise) {
            return await this._manifestPromise;
        }
        this._manifestPromise = (async () => {
            const manifestPath = process.env['USB_UI_TEST_ASSET_MANIFEST_PATH'];
            if (manifestPath && manifestPath.trim()) {
                const raw = await fsp.readFile(path.resolve(manifestPath), 'utf-8');
                return JSON.parse(raw);
            }
            const localManifestPath = path.join(this._resourceDir, 'assets-manifest.json');
            if (fs.existsSync(localManifestPath)) {
                const raw = await fsp.readFile(localManifestPath, 'utf-8');
                return JSON.parse(raw);
            }
            const manifestUrl = process.env['USB_UI_TEST_ASSET_MANIFEST_URL'];
            if (manifestUrl && manifestUrl.trim()) {
                const response = await fetch(manifestUrl);
                if (!response.ok) {
                    throw new Error(`Failed to download the UsbUiTest asset manifest from ${manifestUrl}: ${response.status} ${response.statusText}`);
                }
                return await response.json();
            }
            return undefined;
        })();
        return await this._manifestPromise;
    }
    async _isValidAssetFile(filePath, asset) {
        try {
            const bytes = await fsp.readFile(filePath);
            return bytes.length === asset.size && sha256Hex(bytes) === asset.sha256.toLowerCase();
        }
        catch {
            return false;
        }
    }
    async _readAssetBytes(assetUrl) {
        if (assetUrl.startsWith('file://')) {
            return await fsp.readFile((0, node_url_1.fileURLToPath)(assetUrl));
        }
        const response = await fetch(assetUrl);
        if (!response.ok) {
            throw new Error(`Failed to download the UsbUiTest asset from ${assetUrl}: ${response.status} ${response.statusText}`);
        }
        return Buffer.from(await response.arrayBuffer());
    }
}
exports.RuntimeAssetStore = RuntimeAssetStore;
//# sourceMappingURL=runtimeAssets.js.map