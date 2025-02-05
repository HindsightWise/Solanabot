/**
 * Core type definitions for Eliza framework
 * @module types
 */

/**
 * Plugin interface definition
 */
export interface Plugin {
    /** Initialize plugin with context */
    initialize(context: PluginContext, options?: Record<string, any>): Promise<void>;
    /** Optional cleanup method */
    destroy?(): Promise<void>;
    /** Plugin metadata */
    metadata?: PluginMetadata;
}

/**
 * Plugin metadata interface
 */
export interface PluginMetadata {
    /** Plugin version */
    version: string;
    /** Plugin description */
    description?: string;
    /** Plugin capabilities */
    capabilities?: string[];
    /** Required permissions */
    permissions?: string[];
    /** Plugin author */
    author?: string;
    /** Plugin homepage */
    homepage?: string;
    /** Plugin repository */
    repository?: string;
    /** Plugin license */
    license?: string;
    /** Plugin keywords */
    keywords?: string[];
    /** Custom metadata */
    [key: string]: any;
}

/**
 * Plugin context provided to each plugin
 */
export interface PluginContext {
    /** Register plugin capability */
    registerCapability(name: string, handler: CapabilityHandler): void;
    /** Unregister plugin capability */
    unregisterCapability(name: string): void;
    /** Event management */
    events: Events;
    /** Logging interface */
    logger: Logger;
}

/**
 * Capability handler type
 */
export type CapabilityHandler = (
    data: any,
    context?: Record<string, any>
) => Promise<any>;

/**
 * Event system interface
 */
export interface Events {
    /** Register event listener */
    on(event: string, listener: EventListener): void;
    /** Remove event listener */
    off(event: string, listener: EventListener): void;
    /** Emit event */
    emit(event: string, data?: any): void;
}

/**
 * Event listener type
 */
export type EventListener = (event: ElizaEvent) => void | Promise<void>;

/**
 * Event interface
 */
export interface ElizaEvent {
    /** Event type */
    type: string;
    /** Event timestamp */
    timestamp: number;
    /** Event data */
    data?: any;
    /** Event metadata */
    metadata?: {
        /** Plugin ID */
        pluginId?: string;
        /** Event version */
        version?: string;
        /** Correlation ID for tracing */
        correlationId?: string;
        /** Additional metadata */
        [key: string]: any;
    };
}

/**
 * Simplified logger interface
 */
export interface Logger {
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * Plugin configuration types
 */
export interface PluginConfig {
    /** Plugin ID */
    id: string;
    /** Plugin class */
    plugin: new () => Plugin;
    /** Plugin dependencies */
    dependencies?: string[];
    /** Plugin options */
    options?: Record<string, any>;
    /** Plugin metadata */
    metadata?: PluginMetadata;
}