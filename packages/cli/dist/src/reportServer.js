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
exports.serveReportWorkspace = serveReportWorkspace;
// Local report HTTP server. Spawned by reportServerManager as a detached
// child process via `usb-ui-test internal-report-server`.
//
// Routes (in order):
//   GET  /health                       -> JSON health probe
//   GET  /api/report/index             -> ReportIndexViewModel JSON
//   GET  /api/report/runs/:runId       -> ReportRunManifest JSON
//   GET  /artifacts/<...>              -> streamed artifact file (Range-aware)
//   HEAD /artifacts/<...>              -> same, headers only (video scrubbing)
//   GET  /*                            -> Vite SPA static bundle (index.html fallback for deep links)
const fs = __importStar(require("node:fs"));
const fsp = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_http_1 = require("node:http");
const reportViewModel_js_1 = require("./reportViewModel.js");
const reportArtifactStream_js_1 = require("./reportArtifactStream.js");
const contentTypes_js_1 = require("./contentTypes.js");
// SPA dir resolution priority:
//   1. USB_UI_TEST_REPORT_APP_DIR — set by initializeCliRuntimeEnvironment when
//      the local-runtime tarball is installed (Bun-compiled binary path).
//   2. ../report-app relative to __dirname — dev / tsc-compiled path, where
//      the Vite SPA dist is copied next to dist/src/ by copyReportApp.mjs at
//      build time. (tsc with Node16 emits CJS for this package — there's no
//      "type": "module" — so __dirname is available.)
//
// The value is normalized via path.resolve so the path-traversal guard at
// the asset-serving call site (startsWith(SPA_DIR + path.sep)) compares
// against a canonical, segment-collapsed prefix.
const SPA_DIR = path.resolve(process.env['USB_UI_TEST_REPORT_APP_DIR']?.trim() ||
    path.resolve(__dirname, '..', 'report-app'));
async function serveReportWorkspace(params) {
    const artifactsDir = path.resolve(params.artifactsDir);
    const workspaceRoot = path.resolve(params.workspaceRoot);
    const context = { workspaceRoot, artifactsDir };
    const server = (0, node_http_1.createServer)(async (request, response) => {
        try {
            const method = request.method ?? 'GET';
            const requestPath = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
            if (requestPath === '/health') {
                writeJson(response, 200, {
                    status: 'ok',
                    workspaceRoot,
                    artifactsDir,
                    pid: process.pid,
                });
                return;
            }
            if (requestPath === '/api/report/index') {
                writeJson(response, 200, await (0, reportViewModel_js_1.loadReportIndexViewModel)(context));
                return;
            }
            const runApiMatch = /^\/api\/report\/runs\/([^/]+)$/.exec(requestPath);
            if (runApiMatch) {
                const runId = decodeURIComponent(runApiMatch[1] ?? '');
                try {
                    writeJson(response, 200, await (0, reportViewModel_js_1.loadReportRunManifestViewModel)(runId, context));
                }
                catch (error) {
                    writeJson(response, 404, {
                        status: 'error',
                        message: error instanceof Error ? error.message : String(error),
                    });
                }
                return;
            }
            if (requestPath.startsWith('/artifacts/') && (method === 'GET' || method === 'HEAD')) {
                await (0, reportArtifactStream_js_1.serveArtifactHttp)({
                    artifactsDir,
                    relativePath: (0, reportArtifactStream_js_1.decodeArtifactPath)(requestPath.slice('/artifacts/'.length)),
                    request,
                    response,
                });
                return;
            }
            if (method === 'GET' || method === 'HEAD') {
                await serveSpaAsset(requestPath, request, response);
                return;
            }
            response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('Method Not Allowed');
        }
        catch (error) {
            if (!response.headersSent) {
                response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            }
            response.end(error instanceof Error ? error.message : String(error));
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(params.port, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        throw new Error('Failed to determine report server address.');
    }
    return {
        url: `http://127.0.0.1:${address.port}`,
        close() {
            return new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        },
    };
}
async function serveSpaAsset(requestPath, request, response) {
    const headOnly = request.method === 'HEAD';
    const assetPath = requestPath === '/' ? '/index.html' : requestPath;
    const resolved = path.resolve(SPA_DIR, '.' + assetPath);
    if (!resolved.startsWith(SPA_DIR + path.sep) && resolved !== SPA_DIR) {
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end(headOnly ? undefined : 'Forbidden');
        return;
    }
    let served = await tryServeFile(resolved, response, headOnly, requestPath);
    if (served)
        return;
    // SPA fallback: any unknown path serves index.html so client-side routes
    // resolve on deep-link reload.
    served = await tryServeFile(path.join(SPA_DIR, 'index.html'), response, headOnly, '/index.html');
    if (served)
        return;
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(headOnly ? undefined : 'Report UI bundle not found. Rebuild the CLI.');
}
async function tryServeFile(filePath, response, headOnly, logicalPath) {
    let stats;
    try {
        stats = await fsp.stat(filePath);
    }
    catch {
        return false;
    }
    if (!stats.isFile())
        return false;
    const contentType = contentTypes_js_1.REPORT_CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
        guessSpaContentType(filePath) ??
        'application/octet-stream';
    const cacheControl = isImmutableAsset(logicalPath)
        ? 'public, max-age=31536000, immutable'
        : 'no-store';
    response.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': String(stats.size),
        'Cache-Control': cacheControl,
    });
    if (headOnly) {
        response.end();
        return true;
    }
    fs.createReadStream(filePath).pipe(response);
    return true;
}
function isImmutableAsset(logicalPath) {
    return logicalPath.startsWith('/assets/');
}
function guessSpaContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.js':
        case '.mjs':
            return 'application/javascript; charset=utf-8';
        case '.css':
            return 'text/css; charset=utf-8';
        case '.svg':
            return 'image/svg+xml';
        case '.ico':
            return 'image/x-icon';
        case '.webmanifest':
        case '.map':
            return 'application/json; charset=utf-8';
        case '.woff':
            return 'font/woff';
        case '.woff2':
            return 'font/woff2';
        case '.ttf':
            return 'font/ttf';
        default:
            return undefined;
    }
}
function writeJson(response, status, body) {
    response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    response.end(JSON.stringify(body));
}
//# sourceMappingURL=reportServer.js.map