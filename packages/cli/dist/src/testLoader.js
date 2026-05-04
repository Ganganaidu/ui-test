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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnvironmentConfig = loadEnvironmentConfig;
exports.loadTest = loadTest;
exports.loadTestSuite = loadTestSuite;
exports.validateTestBindings = validateTestBindings;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const yaml_1 = __importDefault(require("yaml"));
const appConfig_js_1 = require("./appConfig.js");
const workspace_js_1 = require("./workspace.js");
const local_executor_1 = require("@usb-ui-test/local-executor");
const ENV_TOP_LEVEL_KEYS = new Set(['app', 'secrets', 'variables']);
const TEST_TOP_LEVEL_KEYS = new Set([
    'name',
    'description',
    'setup',
    'steps',
    'expected_state',
]);
const SUITE_TOP_LEVEL_KEYS = new Set(['name', 'description', 'tests']);
const SECRET_PLACEHOLDER = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;
const TEST_REFERENCE_PATTERN = /\$\{(variables|secrets)\.([A-Za-z0-9_-]+)\}/g;
async function loadEnvironmentConfig(envPath, envName, runtimeEnv) {
    if (!envPath) {
        return {
            envName,
            config: {
                app: undefined,
                secrets: {},
                variables: {},
            },
            bindings: {
                secrets: {},
                variables: {},
            },
            secretReferences: [],
        };
    }
    const raw = await fs.readFile(envPath, 'utf-8').catch(() => {
        throw new Error(`Environment file not found: ${envPath}`);
    });
    const parsed = parseYamlDocument(raw, envPath);
    assertPlainObject(parsed, `Environment file ${envPath}`);
    assertAllowedKeys(parsed, ENV_TOP_LEVEL_KEYS, `Environment file ${envPath}`);
    const secrets = readSecrets(parsed['secrets'], envPath, runtimeEnv);
    const variables = readVariables(parsed['variables'], envPath);
    return {
        envName,
        envPath,
        config: {
            app: (0, appConfig_js_1.readAppConfig)(parsed['app'], `${envPath} app`),
            secrets: Object.fromEntries(secrets.references.map((entry) => [entry.key, `\${${entry.envVar}}`])),
            variables,
        },
        bindings: {
            secrets: secrets.bindings,
            variables,
        },
        secretReferences: secrets.references,
    };
}
async function loadTest(filePath, testsDir) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = parseYamlDocument(raw, filePath);
    assertPlainObject(parsed, `Test file ${filePath}`);
    assertAllowedKeys(parsed, TEST_TOP_LEVEL_KEYS, `Test file ${filePath}`);
    const name = readRequiredString(parsed['name'], `${filePath} name`);
    const description = readOptionalString(parsed['description'], `${filePath} description`);
    // Setup and expected_state stay AI-only (always natural-language strings)
    // for v1. Only the main `steps` array supports structured commands.
    const setup = readStringArray(parsed['setup'], `${filePath} setup`);
    const expected_state = readStringArray(parsed['expected_state'], `${filePath} expected_state`);
    // Read raw entries for `steps`, then auto-detect mode (string entries
    // → AI, structured-mapping entries → deterministic). Mixing the two in
    // one file is rejected.
    const rawSteps = readArrayOrEmpty(parsed['steps'], `${filePath} steps`);
    if (rawSteps.length === 0) {
        throw new Error(`Test file ${filePath} must define a non-empty steps array.`);
    }
    let mode;
    try {
        mode = (0, local_executor_1.detectMode)(rawSteps);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Test file ${filePath} steps: ${msg}`);
    }
    let steps;
    let structuredSteps;
    if (mode === 'deterministic') {
        let parsedSteps;
        try {
            parsedSteps = (0, local_executor_1.parseStructuredSteps)(rawSteps);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`Test file ${filePath} steps: ${msg}`);
        }
        structuredSteps = parsedSteps;
        // Populate the legacy string[] field with human-readable command forms so
        // existing report-rendering and snapshot consumers don't need changes.
        steps = parsedSteps.map(stringifyStructuredStep);
    }
    else {
        steps = readStringArray(parsed['steps'], `${filePath} steps`);
    }
    const relativePath = path.relative(testsDir, filePath).split(path.sep).join('/');
    return {
        name,
        description,
        setup,
        steps,
        expected_state,
        mode,
        ...(structuredSteps ? { structuredSteps } : {}),
        sourcePath: filePath,
        relativePath,
        testId: (0, workspace_js_1.sanitizeId)(relativePath),
    };
}
async function loadTestSuite(filePath, suitesDir) {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = parseYamlDocument(raw, filePath);
    assertPlainObject(parsed, `Test suite ${filePath}`);
    assertAllowedKeys(parsed, SUITE_TOP_LEVEL_KEYS, `Test suite ${filePath}`);
    const name = readRequiredString(parsed['name'], `${filePath} name`);
    const description = readOptionalString(parsed['description'], `${filePath} description`);
    const tests = readStringArray(parsed['tests'], `${filePath} tests`);
    if (tests.length === 0) {
        throw new Error(`Test suite ${filePath} must define a non-empty tests array.`);
    }
    const relativePath = path.relative(suitesDir, filePath).split(path.sep).join('/');
    return {
        name,
        description,
        tests,
        sourcePath: filePath,
        relativePath,
        suiteId: (0, workspace_js_1.sanitizeId)(relativePath),
    };
}
function validateTestBindings(test, envConfig, options) {
    const unresolvedReferences = new Set();
    const values = [
        test.name,
        test.description,
        ...test.setup,
        ...test.steps,
        ...test.expected_state,
    ].filter((value) => typeof value === 'string');
    for (const value of values) {
        for (const match of value.matchAll(TEST_REFERENCE_PATTERN)) {
            const namespace = match[1];
            const key = match[2];
            if (namespace === 'variables' && envConfig.variables[key] === undefined) {
                unresolvedReferences.add(match[0]);
            }
            if (namespace === 'secrets' && envConfig.secrets[key] === undefined) {
                unresolvedReferences.add(match[0]);
            }
        }
    }
    if (unresolvedReferences.size > 0) {
        if (options?.environmentResolved === false) {
            throw new Error(`Test references environment bindings, but no environment configuration was resolved. Add .usb-ui-test/env/<name>.yaml or pass --env <name>: ${Array.from(unresolvedReferences).join(', ')}`);
        }
        throw new Error(`Test references unknown environment bindings: ${Array.from(unresolvedReferences).join(', ')}`);
    }
}
function parseYamlDocument(raw, filePath) {
    const document = yaml_1.default.parseDocument(raw);
    if (document.errors.length > 0) {
        const firstError = document.errors[0];
        throw new Error(`Invalid YAML in ${filePath}: ${firstError.message}`);
    }
    return document.toJS();
}
function readSecrets(value, filePath, runtimeEnv) {
    if (value === undefined || value === null) {
        return { references: [], bindings: {} };
    }
    assertPlainObject(value, `${filePath} secrets`);
    const references = [];
    const bindings = {};
    for (const [key, rawValue] of Object.entries(value)) {
        if (typeof rawValue !== 'string') {
            throw new Error(`${filePath} secrets.${key} must be a string placeholder.`);
        }
        const match = rawValue.match(SECRET_PLACEHOLDER);
        if (!match) {
            throw new Error(`${filePath} secrets.${key} must use the exact form \${ENV_VAR}.`);
        }
        const envVar = match[1];
        const resolvedValue = runtimeEnv.get(envVar);
        if (resolvedValue === undefined) {
            throw new Error(`${filePath} secrets.${key} references missing environment variable ${envVar}.`);
        }
        references.push({ key, envVar });
        bindings[key] = resolvedValue;
    }
    return { references, bindings };
}
function readVariables(value, filePath) {
    if (value === undefined || value === null) {
        return {};
    }
    assertPlainObject(value, `${filePath} variables`);
    const variables = {};
    for (const [key, rawValue] of Object.entries(value)) {
        if (typeof rawValue !== 'string' &&
            typeof rawValue !== 'number' &&
            typeof rawValue !== 'boolean') {
            throw new Error(`${filePath} variables.${key} must be a string, number, or boolean.`);
        }
        variables[key] = rawValue;
    }
    return variables;
}
/**
 * Like readStringArray but returns raw entries (mixed types) for downstream
 * mode detection. Empty/missing inputs return [] (caller decides if that's
 * an error in context).
 */
function readArrayOrEmpty(value, label) {
    if (value === undefined || value === null)
        return [];
    if (!Array.isArray(value)) {
        throw new Error(`${label} must be an array.`);
    }
    return value;
}
/** Compact one-line rendering of a structured step for legacy string[] consumers. */
function stringifyStructuredStep(step) {
    switch (step.kind) {
        case 'launchApp':
            return step.appId
                ? `launchApp ${step.appId}${step.clearState ? ' (clear)' : ''}`
                : 'launchApp';
        case 'clearAppData':
            return step.appId ? `clearAppData ${step.appId}` : 'clearAppData';
        case 'tapOn':
            return `tapOn ${describeSelectorShort(step.selector)}`;
        case 'inputText':
            return step.into
                ? `inputText into ${describeSelectorShort(step.into)}`
                : 'inputText';
        case 'swipe':
            return step.direction
                ? `swipe ${step.direction}`
                : `swipe ${step.from?.x},${step.from?.y} -> ${step.to?.x},${step.to?.y}`;
        case 'assertVisible':
            return `assertVisible ${describeSelectorShort(step.selector)}`;
        case 'assertNotVisible':
            return `assertNotVisible ${describeSelectorShort(step.selector)}`;
        case 'waitFor':
            return `waitFor ${describeSelectorShort(step.selector)}`;
        default: {
            // Exhaustiveness guard — if a new StructuredStep kind is added in
            // local-executor, TS will fail to narrow `step` to never here.
            const _exhaustive = step;
            throw new Error(`stringifyStructuredStep: unknown step kind ${JSON.stringify(_exhaustive)}`);
        }
    }
}
function describeSelectorShort(sel) {
    if (sel.text)
        return `"${sel.text}"`;
    if (sel.id)
        return `#${sel.id}`;
    if (sel.accessibility)
        return `@${sel.accessibility}`;
    if (sel.contains)
        return `~"${sel.contains}"`;
    return '<no-selector>';
}
function readStringArray(value, label) {
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
        throw new Error(`${label} must be an array of strings.`);
    }
    return value;
}
function readRequiredString(value, label) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${label} must be a non-empty string.`);
    }
    return value;
}
function readOptionalString(value, label) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`${label} must be a string when provided.`);
    }
    return value;
}
function assertPlainObject(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${label} must be a YAML mapping/object.`);
    }
}
function assertAllowedKeys(value, allowedKeys, label) {
    for (const key of Object.keys(value)) {
        if (!allowedKeys.has(key)) {
            throw new Error(`${label} contains unsupported key "${key}".`);
        }
    }
}
//# sourceMappingURL=testLoader.js.map