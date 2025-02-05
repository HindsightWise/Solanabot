/**
 * Centralized logging system for Eliza framework
 * @module logging
 */

import { ElizaError } from '../errors';

/**
 * Log levels with corresponding numerical values
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

/**
 * Interface for structured log entries
 */
export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    error?: Error;
    tags?: string[];
    metadata?: {
        pluginId?: string;
        transactionId?: string;
        correlationId?: string;
        [key: string]: any;
    };
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
    minLevel?: LogLevel;
    enableConsole?: boolean;
    enableFile?: boolean;
    filePath?: string;
    formatters?: {
        [key: string]: (value: any) => string;
    };
    filters?: {
        [key: string]: (entry: LogEntry) => boolean;
    };
}

/**
 * Core logger implementation
 */
export class Logger {
    private config: Required<LoggerConfig>;
    private transports: LogTransport[] = [];

    constructor(config?: LoggerConfig) {
        this.config = {
            minLevel: LogLevel.INFO,
            enableConsole: true,
            enableFile: false,
            filePath: './logs/eliza.log',
            formatters: {},
            filters: {},
            ...config
        };

        this.initializeTransports();
    }

    /**
     * Initialize configured log transports
     */
    private initializeTransports(): void {
        if (this.config.enableConsole) {
            this.transports.push(new ConsoleTransport());
        }

        if (this.config.enableFile) {
            this.transports.push(
                new FileTransport(this.config.filePath)
            );
        }
    }

    /**
     * Log at debug level
     */
    debug(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, { context });
    }

    /**
     * Log at info level
     */
    info(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, { context });
    }

    /**
     * Log at warn level
     */
    warn(message: string, context?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, { context });
    }

    /**
     * Log at error level with error tracking
     */
    error(message: string, error?: Error, context?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, { error, context });
    }

    /**
     * Core logging logic
     */
    private log(
        level: LogLevel,
        message: string,
        options: {
            error?: Error;
            context?: Record<string, any>;
            tags?: string[];
            metadata?: Record<string, any>;
        } = {}
    ): void {
        if (level < this.config.minLevel) return;

        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            message,
            context: options.context,
            error: options.error,
            tags: options.tags,
            metadata: options.metadata
        };

        // Apply filters
        if (this.shouldFilter(entry)) return;

        // Format entry
        const formattedEntry = this.formatEntry(entry);

        // Send to all transports
        this.transports.forEach(transport => {
            transport.write(formattedEntry);
        });
    }

    /**
     * Apply configured filters
     */
    private shouldFilter(entry: LogEntry): boolean {
        return Object.values(this.config.filters).some(
            filter => !filter(entry)
        );
    }

    /**
     * Format log entry using configured formatters
     */
    private formatEntry(entry: LogEntry): LogEntry {
        const formatted = { ...entry };

        if (formatted.error instanceof ElizaError) {
            formatted.context = {
                ...formatted.context,
                ...formatted.error.toJSON()
            };
        }

        Object.entries(this.config.formatters).forEach(([key, formatter]) => {
            if (formatted.context?.[key]) {
                formatted.context[key] = formatter(formatted.context[key]);
            }
        });

        return formatted;
    }
}

/**
 * Base interface for log transports
 */
interface LogTransport {
    write(entry: LogEntry): void;
}

/**
 * Console transport implementation
 */
class ConsoleTransport implements LogTransport {
    private static readonly LEVEL_STYLES = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m'  // Red
    };

    write(entry: LogEntry): void {
        const timestamp = new Date(entry.timestamp).toISOString();
        const level = LogLevel[entry.level].padEnd(5);
        const style = ConsoleTransport.LEVEL_STYLES[entry.level];
        
        console.log(
            `${style}[${timestamp}] ${level}\x1b[0m ${entry.message}`
        );

        if (entry.context) {
            console.log('Context:', entry.context);
        }

        if (entry.error) {
            console.log('Error:', entry.error);
            if (entry.error.stack) {
                console.log('Stack:', entry.error.stack);
            }
        }
    }
}

/**
 * File transport implementation
 */
class FileTransport implements LogTransport {
    constructor(private filePath: string) {
        // Initialize file logging
    }

    write(entry: LogEntry): void {
        // Implement file writing
        // Note: Actual implementation would use fs.appendFile
    }
}