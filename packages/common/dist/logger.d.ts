/**
 * Log levels — matches typical severity ordering.
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
export interface LogEntry {
    level: LogLevel;
    levelName: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    message: string;
    args: unknown[];
    renderedMessage: string;
    timestamp: string;
    tag: string;
}
export type LoggerSink = (entry: LogEntry) => void;
/**
 * Simple logger replacing Dart's FrLogger.
 * Singleton pattern — call Logger.init() once, then use Logger.d/i/w/e.
 *
 * Dart equivalent: common/FrLogger.dart
 */
export declare class Logger {
    private static _level;
    private static _tag;
    private static _sinks;
    /** Set log level and optional tag (call once at startup). */
    static init(options?: {
        level?: LogLevel;
        tag?: string;
        resetSinks?: boolean;
    }): void;
    static addSink(sink: LoggerSink): void;
    static removeSink(sink: LoggerSink): void;
    /** Debug log. */
    static d(message: string, ...args: unknown[]): void;
    /** Info log. */
    static i(message: string, ...args: unknown[]): void;
    /** Warning log. */
    static w(message: string, ...args: unknown[]): void;
    /** Error log. */
    static e(message: string, error?: unknown): void;
    private static _emit;
}
//# sourceMappingURL=logger.d.ts.map