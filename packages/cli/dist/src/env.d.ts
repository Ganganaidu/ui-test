import { type ReasoningLevel } from '@usb-ui-test/common';
export { MODEL_FORMAT_EXAMPLE, PROVIDER_ENV_VARS, SUPPORTED_AI_PROVIDERS, SUPPORTED_AI_PROVIDERS_LABEL, parseModel, parseModelOptional, type ParsedModel, type SupportedProvider, } from '@usb-ui-test/common';
/**
 * Environment configuration for the CLI.
 * Supports three environments: dev, prod, local.
 *
 * Dart equivalent: MobileCliEnv in mobile_cli/lib/mobile_cli_env.dart
 */
export declare class CliEnv {
    private _values;
    /**
     * Load environment from a .env file or process.env.
     * Dart: Future<void> loadEnv(String envName)
     */
    load(envName?: string, options?: {
        includeDotEnv?: boolean;
        cwd?: string;
        processEnv?: NodeJS.ProcessEnv;
    }): void;
    /** Get a value by key. */
    get(key: string): string | undefined;
    /** Get a required value — throws if missing. */
    getRequired(key: string): string;
    /** Set a value programmatically (e.g., from CLI args). */
    set(key: string, value: string): void;
}
export declare const REASONING_LEVELS_LABEL: string;
export declare function parseReasoningLevel(value: unknown, label: string): ReasoningLevel | undefined;
//# sourceMappingURL=env.d.ts.map