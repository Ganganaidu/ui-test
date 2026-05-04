import type { RuntimeBindings } from './models/Environment.js';
export declare function resolveRuntimePlaceholders(value: string, bindings: RuntimeBindings): string;
export declare function containsSecretPlaceholder(value: string): boolean;
export declare function redactResolvedValue(value: string | undefined, bindings: RuntimeBindings): string | undefined;
//# sourceMappingURL=repoPlaceholders.d.ts.map