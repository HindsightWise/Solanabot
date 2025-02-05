import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connection, PublicKey } from '@solana/web3.js';
import { SolanaPlugin } from '../../src/plugins/SolanaPlugin';
import { createMockContext } from '../utils/testUtils';

describe('SolanaPlugin', () => {
    let plugin: SolanaPlugin;
    let mockConnection: Connection;
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        // Setup mocks
        mockConnection = {
            getVersion: vi.fn().mockResolvedValue({ 'feature-set': 1 }),
            getBalance: vi.fn().mockResolvedValue(1000000),
            onAccountChange: vi.fn().mockReturnValue(1),
            removeAccountChangeListener: vi.fn()
        } as unknown as Connection;

        // Create plugin instance
        plugin = new SolanaPlugin({
            connection: mockConnection,
            endpoint: 'http://localhost:8899'
        });

        // Create mock context
        mockContext = createMockContext();
    });

    describe('Initialization', () => {
        it('should properly initialize plugin', async () => {
            await plugin.initialize(mockContext);
            
            expect(mockConnection.getVersion).toHaveBeenCalled();
            expect(mockContext.registerCapability).toHaveBeenCalledWith(
                'getBalance',
                expect.any(Function)
            );
        });

        it('should handle initialization errors', async () => {
            mockConnection.getVersion.mockRejectedValueOnce(new Error('Connection failed'));
            
            await expect(plugin.initialize(mockContext))
                .rejects.toThrow('Connection failed');
        });
    });

    describe('Account Operations', () => {
        beforeEach(async () => {
            await plugin.initialize(mockContext);
        });

        it('should get account balance', async () => {
            const balance = await plugin.getBalance('TestAddress123');
            
            expect(mockConnection.getBalance).toHaveBeenCalledWith(
                expect.any(PublicKey)
            );
            expect(balance).toBe(1000000);
        });

        it('should handle invalid addresses', async () => {
            await expect(plugin.getBalance('invalid-address'))
                .rejects.toThrow();
        });

        it('should subscribe to account changes', async () => {
            const subscriptionId = await plugin.subscribeAccount('TestAddress123');
            
            expect(mockConnection.onAccountChange).toHaveBeenCalled();
            expect(subscriptionId).toBe(1);
        });
    });

    describe('Event Handling', () => {
        beforeEach(async () => {
            await plugin.initialize(mockContext);
        });

        it('should handle transaction events', async () => {
            await plugin['handleBeforeAction']({
                type: 'transaction',
                data: { /* mock tx data */ }
            });

            // Verify event handling
            expect(mockContext.events.emit).not.toHaveBeenCalled();
        });

        it('should handle errors properly', async () => {
            const error = new Error('Test error');
            await plugin['handleError'](error);
            
            // Verify error handling
            expect(mockContext.events.emit).toHaveBeenCalledWith(
                'error',
                expect.objectContaining({ message: 'Test error' })
            );
        });
    });

    describe('Cleanup', () => {
        beforeEach(async () => {
            await plugin.initialize(mockContext);
        });

        it('should cleanup subscriptions on destroy', async () => {
            // Create subscription
            await plugin.subscribeAccount('TestAddress123');
            
            // Destroy plugin
            await plugin.destroy();
            
            expect(mockConnection.removeAccountChangeListener).toHaveBeenCalled();
        });
    });
});