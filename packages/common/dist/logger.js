"use strict";
// Port of common/FrLogger.dart — simplified for CLI use.
// Uses console.log/warn/error with log-level filtering.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
/**
 * Log levels — matches typical severity ordering.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Simple logger replacing Dart's FrLogger.
 * Singleton pattern — call Logger.init() once, then use Logger.d/i/w/e.
 *
 * Dart equivalent: common/FrLogger.dart
 */
class Logger {
    static _level = LogLevel.INFO;
    static _tag = 'usb-ui-test';
    static _sinks = new Set();
    /** Set log level and optional tag (call once at startup). */
    static init(options) {
        if (options?.level !== undefined)
            Logger._level = options.level;
        if (options?.tag)
            Logger._tag = options.tag;
        if (options?.resetSinks) {
            Logger._sinks.clear();
        }
    }
    static addSink(sink) {
        Logger._sinks.add(sink);
    }
    static removeSink(sink) {
        Logger._sinks.delete(sink);
    }
    /** Debug log. */
    static d(message, ...args) {
        if (Logger._level <= LogLevel.DEBUG) {
            Logger._emit(LogLevel.DEBUG, 'DEBUG', message, args, console.log);
        }
    }
    /** Info log. */
    static i(message, ...args) {
        if (Logger._level <= LogLevel.INFO) {
            Logger._emit(LogLevel.INFO, 'INFO', message, args, console.log);
        }
    }
    /** Warning log. */
    static w(message, ...args) {
        if (Logger._level <= LogLevel.WARN) {
            Logger._emit(LogLevel.WARN, 'WARN', `⚠ ${message}`, args, console.warn);
        }
    }
    /** Error log. */
    static e(message, error) {
        if (Logger._level <= LogLevel.ERROR) {
            Logger._emit(LogLevel.ERROR, 'ERROR', `✖ ${message}`, error !== undefined ? [error] : [], console.error);
        }
    }
    static _emit(level, levelName, message, args, printer) {
        const renderedMessage = `[${Logger._tag}] ${message}`;
        printer(renderedMessage, ...args);
        const entry = {
            level,
            levelName,
            message,
            args,
            renderedMessage: formatLogEntry(renderedMessage, args),
            timestamp: new Date().toISOString(),
            tag: Logger._tag,
        };
        for (const sink of Logger._sinks) {
            sink(entry);
        }
    }
}
exports.Logger = Logger;
function formatLogEntry(message, args) {
    if (args.length === 0) {
        return message;
    }
    const renderedArgs = args.map((arg) => {
        if (typeof arg === 'string') {
            return arg;
        }
        try {
            return JSON.stringify(arg);
        }
        catch {
            return String(arg);
        }
    });
    return [message, ...renderedArgs].join(' ');
}
//# sourceMappingURL=logger.js.map