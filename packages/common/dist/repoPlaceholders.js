"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRuntimePlaceholders = resolveRuntimePlaceholders;
exports.containsSecretPlaceholder = containsSecretPlaceholder;
exports.redactResolvedValue = redactResolvedValue;
const PLACEHOLDER_PATTERN = /\$\{(variables|secrets)\.([A-Za-z0-9_-]+)\}/g;
function resolveRuntimePlaceholders(value, bindings) {
    return value.replace(PLACEHOLDER_PATTERN, (_match, namespace, key) => {
        if (namespace === 'variables') {
            const variableValue = bindings.variables[key];
            return variableValue === undefined ? `\${${namespace}.${key}}` : String(variableValue);
        }
        const secretValue = bindings.secrets[key];
        return secretValue === undefined ? `\${${namespace}.${key}}` : secretValue;
    });
}
function containsSecretPlaceholder(value) {
    return /\$\{secrets\.[A-Za-z0-9_-]+\}/.test(value);
}
function redactResolvedValue(value, bindings) {
    if (!value) {
        return value;
    }
    const replacements = Object.entries(bindings.secrets)
        .filter(([, secretValue]) => Boolean(secretValue))
        .sort(([, left], [, right]) => right.length - left.length);
    if (replacements.length === 0) {
        return value;
    }
    const placeholderBySecretValue = new Map();
    for (const [key, secretValue] of replacements) {
        if (!placeholderBySecretValue.has(secretValue)) {
            placeholderBySecretValue.set(secretValue, `\${secrets.${key}}`);
        }
    }
    const secretPattern = new RegExp(replacements
        .map(([, secretValue]) => escapeRegExp(secretValue))
        .join('|'), 'g');
    return value.replace(secretPattern, (match) => {
        return placeholderBySecretValue.get(match) ?? match;
    });
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=repoPlaceholders.js.map