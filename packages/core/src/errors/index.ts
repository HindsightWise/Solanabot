/**
 * Centralized error handling and type definitions
 * @module errors
 */

/**
 * Base error class for Eliza framework
 */
export class ElizaError extends Error {
    /** Error code for categorization */
    public readonly code: string;
    /** Original error if any */
    public readonly cause?: Error;
    /** Additional error context */
    public readonly context?: Record<string, any>;
    /** Timestamp when error occurred */
    public readonly timestamp: number;
    /** Stack trace analysis */
    public readonly stackAnalysis?: StackAnalysis;

    constructor(
        message: string,
        options?: {
            code?: string;
            cause?: Error;
            context?: Record<string, any>;
        }
    ) {
        super(message);
        this.name = 'ElizaError';
        this.code = options?.code ?? 'UNKNOWN_ERROR';
        this.cause = options?.cause;
        this.context = options?.context;
        this.timestamp = Date.now();
        
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
            this.stackAnalysis = analyzeStackTrace(this.stack);
        }
    }

    /**
     * Get complete error chain for detailed debugging
     */
    getErrorChain(): Error[] {
        const chain = [this];
        let currentError = this.cause;
        
        while (currentError) {
            chain.push(currentError);
            currentError = (currentError as ElizaError).cause;
        }
        
        return chain;
    }

    /**
     * Format error for structured logging
     */
    toJSON(): Record<string, any> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
            stackAnalysis: this.stackAnalysis,
            cause: this.cause instanceof Error ? 
                formatError(this.cause) : 
                undefined
        };
    }
}

/**
 * Blockchain-specific error handling
 */
export class BlockchainError extends ElizaError {
    constructor(
        message: string,
        options?: {
            code?: string;
            cause?: Error;
            context?: Record<string, any>;
            txHash?: string;
            blockHeight?: number;
        }
    ) {
        super(message, {
            code: options?.code ?? 'BLOCKCHAIN_ERROR',
            cause: options?.cause,
            context: {
                ...options?.context,
                txHash: options?.txHash,
                blockHeight: options?.blockHeight
            }
        });
        this.name = 'BlockchainError';
    }
}

/**
 * Trading operation error handling
 */
export class TradingError extends ElizaError {
    constructor(
        message: string,
        options?: {
            code?: string;
            cause?: Error;
            context?: Record<string, any>;
            symbol?: string;
            orderType?: string;
            amount?: number;
        }
    ) {
        super(message, {
            code: options?.code ?? 'TRADING_ERROR',
            cause: options?.cause,
            context: {
                ...options?.context,
                symbol: options?.symbol,
                orderType: options?.orderType,
                amount: options?.amount
            }
        });
        this.name = 'TradingError';
    }
}

/**
 * Stack trace analysis utilities
 */
interface StackAnalysis {
    fileName: string;
    lineNumber: number;
    functionName: string;
    isAsync: boolean;
}

function analyzeStackTrace(stack?: string): StackAnalysis | undefined {
    if (!stack) return undefined;

    const stackLines = stack.split('\n');
    if (stackLines.length < 2) return undefined;

    const firstCallSite = stackLines[1]; // Skip error message line
    
    // Parse stack trace line
    const match = firstCallSite.match(/at (?:async )?(\S+) \((.+):(\d+):(\d+)\)/);
    if (!match) return undefined;

    return {
        functionName: match[1],
        fileName: match[2],
        lineNumber: parseInt(match[3], 10),
        isAsync: firstCallSite.includes('async')
    };
}

/**
 * Error formatting utility
 */
function formatError(error: Error): Record<string, any> {
    if (error instanceof ElizaError) {
        return error.toJSON();
    }

    return {
        name: error.name,
        message: error.message,
        stack: error.stack
    };
}

/**
 * Error code constants
 */
export const ErrorCodes = {
    // System errors
    INITIALIZATION_ERROR: 'INITIALIZATION_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    PLUGIN_ERROR: 'PLUGIN_ERROR',
    
    // Blockchain errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TRANSACTION_ERROR: 'TRANSACTION_ERROR',
    ACCOUNT_ERROR: 'ACCOUNT_ERROR',
    
    // Trading errors
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    INVALID_ORDER: 'INVALID_ORDER',
    MARKET_ERROR: 'MARKET_ERROR',
    
    // Integration errors
    API_ERROR: 'API_ERROR',
    RATE_LIMIT: 'RATE_LIMIT',
    TIMEOUT: 'TIMEOUT'
} as const;

/**
 * Error utility functions
 */
export const ErrorUtils = {
    /**
     * Wrap async operation with error handling
     */
    async withErrorHandling<T>(
        operation: () => Promise<T>,
        errorContext?: Record<string, any>
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (error instanceof ElizaError) {
                throw error;
            }
            
            throw new ElizaError(
                error instanceof Error ? error.message : 'Unknown error occurred',
                {
                    cause: error instanceof Error ? error : undefined,
                    context: errorContext
                }
            );
        }
    },

    /**
     * Create error with additional context
     */
    enrichError(
        error: Error,
        additionalContext: Record<string, any>
    ): ElizaError {
        if (error instanceof ElizaError) {
            return new ElizaError(error.message, {
                code: error.code,
                cause: error.cause,
                context: {
                    ...error.context,
                    ...additionalContext
                }
            });
        }

        return new ElizaError(error.message, {
            cause: error,
            context: additionalContext
        });
    }
};