/**
 * Comprehensive test suite for Plugin Management System
 * @module test/plugin
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PluginManager } from '../../src/plugin/PluginManager';
import { createMockContext } from '../utils/testUtils';
import { Plugin, PluginContext } from '../../src/types';
import { ElizaError, ErrorCodes } from '../../src/errors';

/**
 * Mock plugin factory for testing
 */
function createMockPlugin(config: Partial<Plugin> = {}): Plugin {
    return {
        initialize: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
        metadata: {
            version: '1.0.0',
            description: 'Test Plugin'
        },
        ...config
    };
}

describe('PluginManager Integration Tests', () => {
    let manager: PluginManager;
    let mockContext: PluginContext;

    beforeEach(() => {
        mockContext = createMockContext();
        manager = new PluginManager(mockContext);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Plugin Registration and Initialization', () => {
        it('registers and initializes plugin with correct configuration', async () => {
            // Initialize test plugin
            const mockPlugin = createMockPlugin();
            const pluginConfig = {
                metadata: { version: '1.0.0' },
                dependencies: [],
                options: { testOption: true }
            };

            // Register plugin
            await manager.registerPlugin('test-plugin', mockPlugin, pluginConfig);
            
            // Verify registration
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                'Registered plugin: test-plugin',
                expect.objectContaining({
                    metadata: pluginConfig.metadata
                })
            );

            // Initialize plugins
            await manager.initializePlugins();
            
            // Verify initialization
            expect(mockPlugin.initialize).toHaveBeenCalledWith(
                mockContext,
                pluginConfig.options
            );
        });

        it('handles plugin initialization failures with retry logic', async () => {
            // Setup failing plugin
            const failingPlugin = createMockPlugin({
                initialize: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('First attempt failed'))
                    .mockRejectedValueOnce(new Error('Second attempt failed'))
                    .mockResolvedValueOnce(undefined)
            });

            await manager.registerPlugin('failing-plugin', failingPlugin);
            await manager.initializePlugins();

            // Verify retry attempts
            expect(failingPlugin.initialize).toHaveBeenCalledTimes(3);
            expect(mockContext.logger.error).toHaveBeenCalledTimes(2);
        });
    });

    describe('Dependency Resolution', () => {
        it('initializes plugins in correct dependency order', async () => {
            const initOrder: string[] = [];
            
            // Create plugins with dependencies
            const pluginA = createMockPlugin({
                initialize: vi.fn().mockImplementation(async () => {
                    initOrder.push('A');
                })
            });

            const pluginB = createMockPlugin({
                initialize: vi.fn().mockImplementation(async () => {
                    initOrder.push('B');
                })
            });

            const pluginC = createMockPlugin({
                initialize: vi.fn().mockImplementation(async () => {
                    initOrder.push('C');
                })
            });

            // Register with dependencies
            await manager.registerPlugin('plugin-c', pluginC);
            await manager.registerPlugin('plugin-b', pluginB, {
                dependencies: ['plugin-c']
            });
            await manager.registerPlugin('plugin-a', pluginA, {
                dependencies: ['plugin-b']
            });

            // Initialize all plugins
            await manager.initializePlugins();

            // Verify initialization order
            expect(initOrder).toEqual(['C', 'B', 'A']);
        });

        it('detects circular dependencies', async () => {
            // Create circular dependency chain
            const pluginA = createMockPlugin();
            const pluginB = createMockPlugin();

            await manager.registerPlugin('plugin-a', pluginA, {
                dependencies: ['plugin-b']
            });
            
            await expect(
                manager.registerPlugin('plugin-b', pluginB, {
                    dependencies: ['plugin-a']
                })
            ).rejects.toThrow(
                new ElizaError('Circular dependency detected', {
                    code: ErrorCodes.CONFIGURATION_ERROR
                })
            );
        });
    });

    describe('Plugin Health Monitoring', () => {
        it('monitors plugin health and handles failures', async () => {
            const mockPlugin = createMockPlugin();
            await manager.registerPlugin('test-plugin', mockPlugin);
            await manager.initializePlugins();

            // Simulate health check interval
            vi.advanceTimersByTime(31000);

            // Verify health monitoring
            expect(mockContext.logger.warn).toHaveBeenCalledWith(
                'Plugin heartbeat timeout: test-plugin',
                expect.any(Object)
            );
        });

        it('implements failover strategy for failing plugins', async () => {
            const failingPlugin = createMockPlugin({
                initialize: vi.fn().mockRejectedValue(
                    new Error('Critical failure')
                )
            });

            await manager.registerPlugin('failing-plugin', failingPlugin, {
                errorHandling: {
                    recoveryStrategy: 'failover'
                }
            });

            // Trigger initialization
            await expect(manager.initializePlugins()).rejects.toThrow();

            // Verify failover attempt
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                'Failover initiated for plugin: failing-plugin'
            );
        });
    });

    describe('Plugin Cleanup', () => {
        it('performs graceful shutdown of plugins', async () => {
            const mockPlugin = createMockPlugin();
            await manager.registerPlugin('test-plugin', mockPlugin);
            await manager.initializePlugins();

            // Trigger cleanup
            await manager['terminatePlugin']('test-plugin');

            // Verify cleanup
            expect(mockPlugin.destroy).toHaveBeenCalled();
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                'Terminating plugin: test-plugin'
            );
        });

        it('handles cleanup failures gracefully', async () => {
            const failingPlugin = createMockPlugin({
                destroy: vi.fn().mockRejectedValue(
                    new Error('Cleanup failed')
                )
            });

            await manager.registerPlugin('failing-plugin', failingPlugin);
            await manager.initializePlugins();

            // Trigger cleanup
            await manager['terminatePlugin']('failing-plugin');

            // Verify error handling
            expect(mockContext.logger.error).toHaveBeenCalledWith(
                'Plugin termination failed: failing-plugin',
                expect.any(Error)
            );
        });
    });
});