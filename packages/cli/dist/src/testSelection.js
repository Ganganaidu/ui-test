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
exports.TEST_SELECTION_REQUIRED_ERROR = void 0;
exports.normalizeTestSelectors = normalizeTestSelectors;
exports.selectTestFiles = selectTestFiles;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const workspace_js_1 = require("./workspace.js");
exports.TEST_SELECTION_REQUIRED_ERROR = 'At least one test selector is required. Pass a YAML file, directory, or glob under .usb-ui-test/tests.';
function normalizeTestSelectors(selectors) {
    if (!selectors) {
        return [];
    }
    return selectors.flatMap((selector) => selector
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0));
}
async function selectTestFiles(testsDir, selectors, options) {
    const normalizedSelectors = normalizeTestSelectors(selectors);
    const allTestFiles = (await collectYamlFiles(testsDir)).sort();
    if (normalizedSelectors.length === 0) {
        if (options?.requireSelection) {
            throw new Error(exports.TEST_SELECTION_REQUIRED_ERROR);
        }
        if (allTestFiles.length === 0) {
            throw new Error(`No YAML tests found under ${testsDir}`);
        }
        return allTestFiles;
    }
    const selectedFiles = new Set();
    for (const selector of normalizedSelectors) {
        const matchedFiles = await expandSelector(testsDir, selector, allTestFiles);
        for (const filePath of matchedFiles) {
            selectedFiles.add(filePath);
        }
    }
    return Array.from(selectedFiles);
}
async function expandSelector(testsDir, selector, allTestFiles) {
    if (!hasGlobMagic(selector)) {
        const resolvedPath = resolveSelectorPath(selector, testsDir);
        (0, workspace_js_1.assertPathWithinRoot)(testsDir, resolvedPath, 'Test selector');
        const stats = await fs.stat(resolvedPath).catch(() => null);
        if (stats?.isDirectory()) {
            return expandDirectorySelector(testsDir, selector, resolvedPath, allTestFiles);
        }
        if (!(0, workspace_js_1.isYamlFile)(resolvedPath)) {
            throw new Error(`Test selector must point to a .yaml or .yml file: ${selector}`);
        }
        if (!stats?.isFile()) {
            const similar = findSimilarFiles(selector, allTestFiles, testsDir);
            const suggestion = similar.length > 0
                ? `\n\nDid you mean?\n${similar.map(f => `  - ${f}`).join('\n')}`
                : '';
            throw new Error(`Test file not found: ${selector}${suggestion}`);
        }
        return [resolvedPath];
    }
    const pattern = normalizeGlobSelector(selector, testsDir);
    const matcher = globToRegExp(pattern);
    const matchedFiles = allTestFiles.filter((filePath) => {
        const relativePath = path.relative(testsDir, filePath).split(path.sep).join('/');
        return matcher.test(relativePath);
    });
    if (matchedFiles.length === 0) {
        throw new Error(`No tests matched selector "${selector}" inside ${testsDir}`);
    }
    return matchedFiles;
}
function expandDirectorySelector(testsDir, selector, directoryPath, allTestFiles) {
    const matchedFiles = allTestFiles.filter((filePath) => isPathWithinDirectory(directoryPath, filePath));
    if (matchedFiles.length === 0) {
        throw new Error(`No YAML tests found under selector "${selector}" inside ${testsDir}`);
    }
    return matchedFiles;
}
function hasGlobMagic(value) {
    return /[*?[\]{}]/.test(value);
}
function resolveSelectorPath(selector, testsDir) {
    const normalizedSelector = selector.split(path.sep).join('/');
    const workspaceRoot = path.resolve(testsDir, '..', '..');
    if (path.isAbsolute(selector)) {
        return path.resolve(selector);
    }
    if (normalizedSelector.startsWith('.usb-ui-test/tests/')) {
        return path.resolve(workspaceRoot, selector);
    }
    return path.resolve(testsDir, selector);
}
function normalizeGlobSelector(selector, testsDir) {
    if (path.isAbsolute(selector)) {
        (0, workspace_js_1.assertPathWithinRoot)(testsDir, selector, 'Test selector');
        return path.relative(testsDir, selector).split(path.sep).join('/');
    }
    const normalizedSelector = selector.split(path.sep).join('/');
    if (normalizedSelector.startsWith('.usb-ui-test/tests/')) {
        const relativePattern = normalizedSelector.replace(/^\.usb-ui-test\/tests\//, '');
        if (relativePattern.startsWith('..')) {
            throw new Error(`Test selector must stay inside ${testsDir}`);
        }
        return relativePattern;
    }
    if (normalizedSelector.startsWith('../')) {
        throw new Error(`Test selector must stay inside ${testsDir}`);
    }
    return normalizedSelector.replace(/^\.\//, '');
}
function isPathWithinDirectory(directoryPath, candidatePath) {
    const relative = path.relative(directoryPath, candidatePath);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}
function globToRegExp(pattern) {
    const segments = pattern.split('/');
    const parts = [];
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment === '**') {
            const isLast = i === segments.length - 1;
            if (isLast) {
                if (parts.length > 0) {
                    parts.push('/');
                }
                parts.push('.*');
            }
            else {
                // Match zero or more directory levels (including none).
                // When preceded by a literal segment (e.g. auth/**/), include
                // the leading slash so "auth" doesn't prefix-match "authz".
                if (parts.length > 0) {
                    parts.push('/(?:.*/)?');
                }
                else {
                    parts.push('(?:.*/)?');
                }
            }
        }
        else {
            const escaped = segment
                .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                .replace(/\*/g, '[^/]*')
                .replace(/\?/g, '[^/]');
            if (parts.length > 0 && !parts[parts.length - 1].endsWith(')?')) {
                parts.push('/');
            }
            parts.push(escaped);
        }
    }
    return new RegExp(`^${parts.join('')}$`);
}
function levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++)
        dp[i][0] = i;
    for (let j = 0; j <= n; j++)
        dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}
function findSimilarFiles(selector, allTestFiles, testsDir) {
    const maxDistance = Math.ceil(selector.length * 0.4);
    const scored = allTestFiles
        .map((filePath) => {
        const relative = path.relative(testsDir, filePath).split(path.sep).join('/');
        return { relative, distance: levenshteinDistance(selector, relative) };
    })
        .filter((entry) => entry.distance > 0 && entry.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance);
    return scored.slice(0, 3).map((entry) => entry.relative);
}
async function collectYamlFiles(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const filePaths = [];
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            filePaths.push(...(await collectYamlFiles(fullPath)));
            continue;
        }
        if (entry.isFile() && (0, workspace_js_1.isYamlFile)(fullPath)) {
            filePaths.push(fullPath);
        }
    }
    return filePaths;
}
//# sourceMappingURL=testSelection.js.map