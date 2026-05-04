"use strict";
// parser.ts
//
// Turns raw YAML step entries into typed StructuredStep objects, and tells
// the host which mode a test file is in (deterministic vs AI). The detection
// rule: every step in a deterministic file is a YAML mapping with exactly one
// recognized command key. The moment we see a plain string entry the file is
// AI mode and the AI executor takes over.
//
// Errors thrown here are caught by the YAML loader and surfaced with the
// source file path; they read like "auth/login.yaml: tapOn requires
// `selector` (text/id/accessibility/contains)".
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMode = detectMode;
exports.parseStructuredSteps = parseStructuredSteps;
const COMMAND_KEYS = new Set([
    'launchApp',
    'clearAppData',
    'tapOn',
    'inputText',
    'swipe',
    'assertVisible',
    'assertNotVisible',
    'waitFor',
]);
const SWIPE_DIRECTIONS = new Set([
    'up',
    'down',
    'left',
    'right',
]);
/**
 * Returns 'deterministic' if every entry in `steps` is a YAML mapping with a
 * recognized command key. Returns 'ai' if every entry is a string. Throws on
 * mixed input — we don't try to be clever about half-typed files because the
 * resulting test would be confusing to debug.
 */
function detectMode(steps) {
    if (steps.length === 0)
        return 'ai';
    const isStructuredEntry = (entry) => {
        if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
            return false;
        }
        const keys = Object.keys(entry);
        return keys.length === 1 && COMMAND_KEYS.has(keys[0]);
    };
    const isStringEntry = (entry) => typeof entry === 'string';
    const allStructured = steps.every(isStructuredEntry);
    if (allStructured)
        return 'deterministic';
    const allStrings = steps.every(isStringEntry);
    if (allStrings)
        return 'ai';
    // Mixed — find the first offender for a useful error message.
    for (let i = 0; i < steps.length; i++) {
        if (!isStructuredEntry(steps[i]) && !isStringEntry(steps[i])) {
            throw new Error(`step[${i}] is neither a structured command (e.g. {tapOn: ...}) nor a natural-language string`);
        }
    }
    throw new Error('steps mix natural-language strings and structured commands; pick one mode per test file');
}
/**
 * Parse a list of raw YAML step entries into StructuredStep objects.
 * Caller has already established this file is deterministic (via detectMode).
 */
function parseStructuredSteps(rawSteps) {
    return rawSteps.map((raw, i) => {
        try {
            return parseOneStep(raw);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new Error(`step[${i}]: ${msg}`);
        }
    });
}
function parseOneStep(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        throw new Error('expected a YAML mapping like {tapOn: ...}');
    }
    const obj = raw;
    const keys = Object.keys(obj);
    if (keys.length !== 1) {
        throw new Error(`expected exactly one command key, got ${keys.length} (${keys.join(', ')})`);
    }
    const key = keys[0];
    const value = obj[key];
    switch (key) {
        case 'launchApp':
            return parseLaunchApp(value);
        case 'clearAppData':
            return parseClearAppData(value);
        case 'tapOn':
            return { kind: 'tapOn', selector: parseSelector(value, 'tapOn') };
        case 'inputText':
            return parseInputText(value);
        case 'swipe':
            return parseSwipe(value);
        case 'assertVisible':
            return {
                kind: 'assertVisible',
                selector: parseSelector(value, 'assertVisible'),
            };
        case 'assertNotVisible':
            return {
                kind: 'assertNotVisible',
                selector: parseSelector(value, 'assertNotVisible'),
            };
        case 'waitFor':
            return parseWaitFor(value);
        default:
            throw new Error(`unknown command "${key}"`);
    }
}
function parseLaunchApp(value) {
    // Allow either: `launchApp:` (no value), `launchApp: com.x.y`, or
    // `launchApp: { appId: ..., clearState: true }`.
    if (value === null || value === undefined) {
        return { kind: 'launchApp' };
    }
    if (typeof value === 'string') {
        return { kind: 'launchApp', appId: value };
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        const obj = value;
        return {
            kind: 'launchApp',
            ...(typeof obj['appId'] === 'string' ? { appId: obj['appId'] } : {}),
            ...(typeof obj['clearState'] === 'boolean'
                ? { clearState: obj['clearState'] }
                : {}),
        };
    }
    throw new Error('launchApp expected: empty | string appId | object {appId?, clearState?}');
}
function parseClearAppData(value) {
    if (value === null || value === undefined) {
        return { kind: 'clearAppData' };
    }
    if (typeof value === 'string') {
        return { kind: 'clearAppData', appId: value };
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        const obj = value;
        return {
            kind: 'clearAppData',
            ...(typeof obj['appId'] === 'string' ? { appId: obj['appId'] } : {}),
        };
    }
    throw new Error('clearAppData expected: empty | string appId | object {appId?}');
}
function parseInputText(value) {
    if (typeof value === 'string') {
        return { kind: 'inputText', value };
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value;
        if (typeof obj['value'] !== 'string') {
            throw new Error('inputText.value must be a string');
        }
        return {
            kind: 'inputText',
            value: obj['value'],
            ...(obj['into'] !== undefined
                ? { into: parseSelector(obj['into'], 'inputText.into') }
                : {}),
            ...(typeof obj['clear'] === 'boolean' ? { clear: obj['clear'] } : {}),
        };
    }
    throw new Error('inputText expected: string | {value, into?, clear?}');
}
function parseSwipe(value) {
    if (typeof value === 'string' && SWIPE_DIRECTIONS.has(value)) {
        return { kind: 'swipe', direction: value };
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value;
        if (typeof obj['direction'] === 'string' &&
            SWIPE_DIRECTIONS.has(obj['direction'])) {
            return {
                kind: 'swipe',
                direction: obj['direction'],
                ...(typeof obj['durationMs'] === 'number'
                    ? { durationMs: obj['durationMs'] }
                    : {}),
            };
        }
        if (typeof obj['from'] === 'object' &&
            obj['from'] !== null &&
            typeof obj['to'] === 'object' &&
            obj['to'] !== null) {
            return {
                kind: 'swipe',
                from: parseCoord(obj['from'], 'swipe.from'),
                to: parseCoord(obj['to'], 'swipe.to'),
                ...(typeof obj['durationMs'] === 'number'
                    ? { durationMs: obj['durationMs'] }
                    : {}),
            };
        }
    }
    throw new Error('swipe expected: up|down|left|right | {direction} | {from:{x,y}, to:{x,y}, durationMs?}');
}
function parseWaitFor(value) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value;
        return {
            kind: 'waitFor',
            selector: parseSelector(obj['selector'] ?? obj, 'waitFor'),
            ...(typeof obj['timeoutMs'] === 'number'
                ? { timeoutMs: obj['timeoutMs'] }
                : {}),
        };
    }
    if (typeof value === 'string') {
        return { kind: 'waitFor', selector: { text: value } };
    }
    throw new Error('waitFor expected: string | {text/id/..., timeoutMs?}');
}
function parseSelector(value, ctx) {
    if (typeof value === 'string') {
        return { text: value };
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${ctx} selector must be a string or mapping`);
    }
    const obj = value;
    const sel = {
        ...(typeof obj['text'] === 'string' ? { text: obj['text'] } : {}),
        ...(typeof obj['id'] === 'string' ? { id: obj['id'] } : {}),
        ...(typeof obj['accessibility'] === 'string'
            ? { accessibility: obj['accessibility'] }
            : {}),
        ...(typeof obj['contains'] === 'string'
            ? { contains: obj['contains'] }
            : {}),
        ...(typeof obj['index'] === 'number' ? { index: obj['index'] } : {}),
        ...(typeof obj['caseInsensitive'] === 'boolean'
            ? { caseInsensitive: obj['caseInsensitive'] }
            : {}),
    };
    if (sel.text === undefined &&
        sel.id === undefined &&
        sel.accessibility === undefined &&
        sel.contains === undefined) {
        throw new Error(`${ctx} selector requires at least one of text/id/accessibility/contains`);
    }
    return sel;
}
function parseCoord(value, ctx) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${ctx} expected {x, y}`);
    }
    const obj = value;
    if (typeof obj['x'] !== 'number' || typeof obj['y'] !== 'number') {
        throw new Error(`${ctx} {x, y} must be numbers`);
    }
    return { x: obj['x'], y: obj['y'] };
}
//# sourceMappingURL=parser.js.map