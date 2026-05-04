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
exports.ArtifactRangeNotSatisfiableError = void 0;
exports.resolveArtifactPath = resolveArtifactPath;
exports.decodeArtifactPath = decodeArtifactPath;
exports.serveArtifactHttp = serveArtifactHttp;
exports.renderHtmlErrorPage = renderHtmlErrorPage;
// HTTP artifact streaming for the local report server. Handles byte-range
// requests (for video scrubbing in the browser), directory-traversal guards,
// and content-type mapping. Ported from packages/report-web/src/artifacts.ts
// so the CLI owns the server-side path.
const fs = __importStar(require("node:fs"));
const fsp = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const contentTypes_js_1 = require("./contentTypes.js");
class ArtifactRangeNotSatisfiableError extends Error {
    size;
    constructor(size) {
        super('Requested artifact byte range is not satisfiable.');
        this.name = 'ArtifactRangeNotSatisfiableError';
        this.size = size;
    }
}
exports.ArtifactRangeNotSatisfiableError = ArtifactRangeNotSatisfiableError;
function resolveArtifactPath(artifactsDir, relativePath) {
    const normalizedRelativePath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const resolvedPath = path.resolve(artifactsDir, normalizedRelativePath);
    const relativeToArtifacts = path.relative(artifactsDir, resolvedPath);
    if (relativeToArtifacts.startsWith('..') || path.isAbsolute(relativeToArtifacts)) {
        throw new Error('Artifact paths must stay within the workspace artifacts directory.');
    }
    return resolvedPath;
}
function decodeArtifactPath(rawRelativePath) {
    return rawRelativePath
        .split('/')
        .filter((segment) => segment.length > 0)
        .map((segment) => decodeURIComponent(segment))
        .join('/');
}
async function serveArtifactHttp(params) {
    const { artifactsDir, relativePath, request, response } = params;
    const method = request.method ?? 'GET';
    const headOnly = method === 'HEAD';
    let resolvedPath;
    try {
        resolvedPath = resolveArtifactPath(artifactsDir, relativePath);
    }
    catch (error) {
        writeErrorHtml(response, 404, 'Artifact Not Found', error.message);
        return;
    }
    let stats;
    try {
        const artifactsRoot = await fsp.realpath(artifactsDir);
        const realResolvedPath = await fsp.realpath(resolvedPath);
        const relativeToRoot = path.relative(artifactsRoot, realResolvedPath);
        if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
            throw new Error('Artifact paths must stay within the workspace artifacts directory.');
        }
        resolvedPath = realResolvedPath;
        stats = await fsp.stat(resolvedPath);
    }
    catch (error) {
        writeErrorHtml(response, 404, 'Artifact Not Found', error instanceof Error ? error.message : String(error));
        return;
    }
    if (!stats.isFile()) {
        writeErrorHtml(response, 404, 'Artifact Not Found', `Not a file: ${resolvedPath}`);
        return;
    }
    const rangeHeader = Array.isArray(request.headers.range)
        ? request.headers.range[0]
        : request.headers.range;
    let byteRange;
    try {
        byteRange = parseByteRange(rangeHeader, stats.size);
    }
    catch (error) {
        if (error instanceof ArtifactRangeNotSatisfiableError) {
            response.writeHead(416, {
                'Content-Range': `bytes */${error.size}`,
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store',
            });
            response.end(headOnly ? undefined : 'Requested range is not satisfiable.');
            return;
        }
        throw error;
    }
    const contentType = contentTypes_js_1.REPORT_CONTENT_TYPES[path.extname(resolvedPath).toLowerCase()] ??
        'application/octet-stream';
    if (byteRange) {
        const length = byteRange.end - byteRange.start + 1;
        response.writeHead(206, {
            'Accept-Ranges': 'bytes',
            'Content-Length': String(length),
            'Content-Range': `bytes ${byteRange.start}-${byteRange.end}/${stats.size}`,
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
        });
        if (headOnly) {
            response.end();
            return;
        }
        pipeFile(response, resolvedPath, { start: byteRange.start, end: byteRange.end });
        return;
    }
    response.writeHead(200, {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(stats.size),
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
    });
    if (headOnly) {
        response.end();
        return;
    }
    pipeFile(response, resolvedPath);
}
function pipeFile(response, resolvedPath, options) {
    const stream = fs.createReadStream(resolvedPath, options);
    stream.on('error', (error) => {
        response.destroy(error);
    });
    stream.pipe(response);
}
function parseByteRange(rangeHeader, totalSize) {
    if (!rangeHeader)
        return undefined;
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match)
        return undefined;
    const [, startValue, endValue] = match;
    if (startValue === '' && endValue === '')
        return undefined;
    if (totalSize === 0) {
        throw new ArtifactRangeNotSatisfiableError(totalSize);
    }
    if (startValue === '') {
        const suffixLength = parseInt(endValue, 10);
        if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
            throw new ArtifactRangeNotSatisfiableError(totalSize);
        }
        const start = Math.max(0, totalSize - suffixLength);
        return { start, end: totalSize - 1 };
    }
    const start = parseInt(startValue, 10);
    const requestedEnd = endValue === '' ? totalSize - 1 : parseInt(endValue, 10);
    if (!Number.isFinite(start) || !Number.isFinite(requestedEnd)) {
        throw new ArtifactRangeNotSatisfiableError(totalSize);
    }
    if (start < 0 || start >= totalSize) {
        throw new ArtifactRangeNotSatisfiableError(totalSize);
    }
    const end = Math.min(requestedEnd, totalSize - 1);
    if (end < start) {
        throw new ArtifactRangeNotSatisfiableError(totalSize);
    }
    return { start, end };
}
function renderHtmlErrorPage(params) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(params.title)}</title>
  <style>
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      background: linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
      color: #1a2740;
    }
    main {
      max-width: 780px;
      margin: 72px auto;
      padding: 0 24px;
    }
    section {
      background: #ffffff;
      border: 1px solid #d7dfeb;
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
      padding: 28px 32px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 28px;
    }
    p {
      margin: 0;
      color: #61728b;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <main>
    <section>
      <h1>${escapeHtml(params.title)}</h1>
      <p>${escapeHtml(params.message)}</p>
    </section>
  </main>
</body>
</html>`;
}
function writeErrorHtml(response, status, title, message) {
    response.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    response.end(renderHtmlErrorPage({ title, message }));
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//# sourceMappingURL=reportArtifactStream.js.map