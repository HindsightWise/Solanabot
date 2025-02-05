/**
 * Advanced plugin management system for Eliza framework
 * @module plugins
 */

import { Logger } from '../logging';
import { ElizaError, ErrorCodes } from '../errors';
import type { Plugin, PluginMetadata, PluginContext } from '../types';

/**
 * Plugin configuration interface
 */
interface PluginConfig {
    /** Plugin metadata and versioning */
    metadata?: PluginMetadata;
    /** Required plugin dependencies */
    dependencies?: string[];
    /** Initialization parameters */
    options?: Record<string, any>;
    /** Error handling strategy */
    errorHandling?: {
        retryAttempts?: number;
        timeoutMs?: number;
        recoveryStrategy?: 'restart' | 'failover' | 'terminate';
    };
}

/**
 * Internal plugin registration entry
 */
interface PluginEntry {
    /** Plugin instance */
    plugin: Plugin;
    /** Plugin configuration */
    config: Required<PluginConfig>;
    /** Initialization state */
    isInitialized: boolean;
    /** Health metrics */
    metrics: {
        lastHeartbeat: number;
        errorCount: number;
        warningCount: number;
    };
}

/**
 * Advanced plugin manager with dependency resolution
 */
export class PluginManager {
    private readonly logger = new Logger();
    private readonly plugins = new Map<string, PluginEntry>();
    private readonly dependencies = new Map<string, Set<string>>();
    private readonly context: PluginContext;

    constructor(context: PluginContext) {
        this.context = context;
        this.initializeHealthMonitoring();
    }

    /**
     * Register new plugin with validation
     */
    async registerPlugin(
        name: string,
        plugin: Plugin,
        config: PluginConfig = {}
    ): Promise<void> {
        // Validate plugin configuration
        this.validatePluginConfig(name, config);

        // Normalize configuration
        const normalizedConfig = this.normalizeConfig(config);

        // Register plugin
        this.plugins.set(name, {
            plugin,
            config: normalizedConfig,
            isInitialized: false,
            metrics: {
                lastHeartbeat: Date.now(),
                errorCount: 0,
                warningCount: 0
            }
        });

        // Register dependencies
        if (normalizedConfig.dependencies?.length) {
            this.dependencies.set(
                name,
                new Set(normalizedConfig.dependencies)
            );
        }

        this.logger.info(`Registered plugin: ${name}`, {
            metadata: normalizedConfig.metadata,
            dependencies: normalizedConfig.dependencies
        });
    }

    /**
     * Initialize all plugins in dependency order
     */
    async initializePlugins(): Promise<void> {
        // Resolve initialization order
        const initOrder = this.resolveInitializationOrder();

        // Initialize plugins sequentially
        for (const pluginName of initOrder) {
            await this.initializePlugin(pluginName);
        }
    }

    /**
     * Initialize single plugin with error handling
     */
    private async initializePlugin(name: string): Promise<void> {
        const entry = this.plugins.get(name);
        if (!entry) {
            throw new ElizaError(`Plugin not found: ${name}`, {
                code: ErrorCodes.PLUGIN_ERROR
            });
        }

        const { plugin, config } = entry;
        const { retryAttempts, timeoutMs } = config.errorHandling;

        let attempts = 0;
        while (attempts < retryAttempts) {
            try {
                // Initialize with timeout
                await Promise.race([
                    plugin.initialize(this.context, config.options),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Initialization timeout')), 
                        timeoutMs)
                    )
                ]);

                entry.isInitialized = true;
                this.logger.info(`Initialized plugin: ${name}`);
                return;
            } catch (error) {
                attempts++;
                entry.metrics.errorCount++;

                this.logger.error(
                    `Plugin initialization failed (attempt ${attempts}/${retryAttempts}): ${name}`,
                    error instanceof Error ? error : new Error(String(error))
                );

                if (attempts === retryAttempts) {
                    throw new ElizaError(`Failed to initialize plugin: ${name}`, {
                        code: ErrorCodes.PLUGIN_ERROR,
                        cause: error instanceof Error ? error : undefined,
                        context: { attempts }
                    });
                }

                // Wait before retry
                await new Promise(resolve => 
                    setTimeout(resolve, 1000 * attempts)
                );
            }
        }
    }

    /**
     * Resolve plugin initialization order based on dependencies
     */
    private resolveInitializationOrder(): string[] {
        const visited = new Set<string>();
        const initOrder: string[] = [];

        const visit = (name: string, path: Set<string>) => {
            if (path.has(name)) {
                throw new ElizaError('Circular dependency detected', {
                    code: ErrorCodes.CONFIGURATION_ERROR,
                    context: { 
                        cycle: Array.from(path).concat(name).join(' -> ')
                    }
                });
            }

            if (visited.has(name)) return;

            path.add(name);
            const dependencies = this.dependencies.get(name);
            if (dependencies) {
                for (const dep of dependencies) {
                    if (!this.plugins.has(dep)) {
                        throw new ElizaError(
                            `Missing dependency: ${dep} for plugin ${name}`,
                            { code: ErrorCodes.CONFIGURATION_ERROR }
                        );
                    }
                    visit(dep, path);
                }
            }
            path.delete(name);

            visited.add(name);
            initOrder.push(name);
        };

        for (const name of this.plugins.keys()) {
            visit(name, new Set());
        }

        return initOrder;
    }

    /**
     * Setup periodic health monitoring
     */
    private initializeHealthMonitoring(): void {
        setInterval(() => {
            for (const [name, entry] of this.plugins) {
                const { metrics } = entry;
                const elapsed = Date.now() - metrics.lastHeartbeat;

                if (elapsed > 30000) { // 30 second threshold
                    this.logger.warn(`Plugin heartbeat timeout: ${name}`, {
                        elapsed,
                        metrics
                    });
                }

                if (metrics.errorCount > 10) { // Error threshold
                    this.handlePluginFailure(name, entry);
                }
            }
        }, 10000); // Check every 10 seconds
    }

    /**
     * Handle plugin failure based on configuration
     */
    private async handlePluginFailure(
        name: string,
        entry: PluginEntry
    ): Promise<void> {
        const { recoveryStrategy } = entry.config.errorHandling;

        switch (recoveryStrategy) {
            case 'restart':
                await this.restartPlugin(name);
                break;
            case 'failover':
                await this.failoverPlugin(name);
                break;
            case 'terminate':
                await this.terminatePlugin(name);
                break;
        }
    }

    /**
     * Restart failed plugin
     */
    private async restartPlugin(name: string): Promise<void> {
        this.logger.info(`Restarting plugin: ${name}`);
        const entry = this.plugins.get(name)!;
        
        try {
            await entry.plugin.destroy?.();
            entry.isInitialized = false;
            await this.initializePlugin(name);
        } catch (error) {
            this.logger.error(`Plugin restart failed: ${name}`, error as Error);
        }
    }

    /**
     * Failover to backup implementation
     */
    private async failoverPlugin(name: string): Promise<void> {
        // Implementation would depend on failover configuration
        this.logger.info(`Failover initiated for plugin: ${name}`);
    }

    /**
     * Terminate plugin gracefully
     */
    private async terminatePlugin(name: string): Promise<void> {
        this.logger.info(`Terminating plugin: ${name}`);
        const entry = this.plugins.get(name)!;
        
        try {
            await entry.plugin.destroy?.();
            this.plugins.delete(name);
            this.dependencies.delete(name);
        } catch (error) {
            this.logger.error(`Plugin termination failed: ${name}`, error as Error);
        }
    }

    /**
     * Normalize plugin configuration with defaults
     */
    private normalizeConfig(config: PluginConfig): Required<PluginConfig> {
        return {
            metadata: config.metadata ?? {
                version: '1.0.0',
                description: 'No description provided'
            },
            dependencies: config.dependencies ?? [],
            options: config.options ?? {},
            errorHandling: {
                retryAttempts: 3,
                timeoutMs: 5000,
                recoveryStrategy: 'restart',
                ...config.errorHandling
            }
        };
    }

    /**
     * Validate plugin configuration
     */
    private validatePluginConfig(
        name: string,
        config: PluginConfig
    ): void {
        if (this.plugins.has(name)) {
            throw new ElizaError(`Plugin already registered: ${name}`, {
                code: ErrorCodes.CONFIGURATION_ERROR
            });
        }

        if (config.dependencies?.some(dep => !dep)) {
            throw new ElizaError(
                `Invalid dependencies configuration for plugin: ${name}`,
                { code: ErrorCodes.CONFIGURATION_ERROR }
            );
        }

        // Add more validation as needed
    }
}