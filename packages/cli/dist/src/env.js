"use strict";
// Port of mobile_cli/lib/mobile_cli_env.dart
// Loads environment variables from .env files or OS environment.
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
exports.REASONING_LEVELS_LABEL = exports.CliEnv = exports.parseModelOptional = exports.parseModel = exports.SUPPORTED_AI_PROVIDERS_LABEL = exports.SUPPORTED_AI_PROVIDERS = exports.PROVIDER_ENV_VARS = exports.MODEL_FORMAT_EXAMPLE = void 0;
exports.parseReasoningLevel = parseReasoningLevel;
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const common_1 = require("@usb-ui-test/common");
var common_2 = require("@usb-ui-test/common");
Object.defineProperty(exports, "MODEL_FORMAT_EXAMPLE", { enumerable: true, get: function () { return common_2.MODEL_FORMAT_EXAMPLE; } });
Object.defineProperty(exports, "PROVIDER_ENV_VARS", { enumerable: true, get: function () { return common_2.PROVIDER_ENV_VARS; } });
Object.defineProperty(exports, "SUPPORTED_AI_PROVIDERS", { enumerable: true, get: function () { return common_2.SUPPORTED_AI_PROVIDERS; } });
Object.defineProperty(exports, "SUPPORTED_AI_PROVIDERS_LABEL", { enumerable: true, get: function () { return common_2.SUPPORTED_AI_PROVIDERS_LABEL; } });
Object.defineProperty(exports, "parseModel", { enumerable: true, get: function () { return common_2.parseModel; } });
Object.defineProperty(exports, "parseModelOptional", { enumerable: true, get: function () { return common_2.parseModelOptional; } });
/**
 * Environment configuration for the CLI.
 * Supports three environments: dev, prod, local.
 *
 * Dart equivalent: MobileCliEnv in mobile_cli/lib/mobile_cli_env.dart
 */
class CliEnv {
    _values = new Map();
    /**
     * Load environment from a .env file or process.env.
     * Dart: Future<void> loadEnv(String envName)
     */
    load(envName, options) {
        this._values.clear();
        const workingDirectory = options?.cwd ?? process.cwd();
        const processEnv = options?.processEnv ?? process.env;
        if (options?.includeDotEnv !== false && envName) {
            const envFile = path.resolve(workingDirectory, `.env.${envName}`);
            if (fs.existsSync(envFile)) {
                const parsed = dotenv.parse(fs.readFileSync(envFile, 'utf-8'));
                for (const [key, value] of Object.entries(parsed)) {
                    this._values.set(key, value);
                }
            }
        }
        if (options?.includeDotEnv !== false) {
            const plainEnvFile = path.resolve(workingDirectory, '.env');
            if (fs.existsSync(plainEnvFile)) {
                const parsed = dotenv.parse(fs.readFileSync(plainEnvFile, 'utf-8'));
                for (const [key, value] of Object.entries(parsed)) {
                    if (!this._values.has(key)) {
                        this._values.set(key, value);
                    }
                }
            }
        }
        // OS environment variables take highest precedence
        for (const [key, value] of Object.entries(processEnv)) {
            if (value !== undefined) {
                this._values.set(key, value);
            }
        }
    }
    /** Get a value by key. */
    get(key) {
        return this._values.get(key);
    }
    /** Get a required value — throws if missing. */
    getRequired(key) {
        const value = this._values.get(key);
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }
    /** Set a value programmatically (e.g., from CLI args). */
    set(key, value) {
        this._values.set(key, value);
    }
}
exports.CliEnv = CliEnv;
exports.REASONING_LEVELS_LABEL = common_1.REASONING_LEVELS.join(', ');
function parseReasoningLevel(value, label) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`${label} must be a string. Allowed values: ${exports.REASONING_LEVELS_LABEL}.`);
    }
    const trimmed = value.trim();
    if (trimmed === '') {
        return undefined;
    }
    if (!common_1.REASONING_LEVELS.includes(trimmed)) {
        throw new Error(`${label} has invalid value "${trimmed}". Allowed values: ${exports.REASONING_LEVELS_LABEL}.`);
    }
    return trimmed;
}
//# sourceMappingURL=env.js.map