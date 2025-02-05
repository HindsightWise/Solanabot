/**
 * Test utilities for Eliza plugin testing
 * @module testUtils
 */

import { vi } from 'vitest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import type { PluginContext, Events, ElizaEvent } from '../../src/types';

/**
 * Creates a mock plugin context for testing
 */
export function createMockContext(): PluginContext {
    const eventEmitter = {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    };

    return {
        registerCapability: vi.fn(),
        unregisterCapability: vi.fn(),
        events: eventEmitter as unknown as Events,
        logger: {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        }
    };
}

/**
 * Creates a mock Solana connection
 */
export function createMockConnection(): Connection {
    return {
        getVersion: vi.fn().mockResolvedValue({ 'feature-set': 1 }),
        getBalance: vi.fn().mockResolvedValue(1000000),
        onAccountChange: vi.fn().mockReturnValue(1),
        removeAccountChangeListener: vi.fn(),
        getAccountInfo: vi.fn().mockResolvedValue({
            executable: false,
            owner: new PublicKey('11111111111111111111111111111111'),
            lamports: 1000000,
            data: Buffer.alloc(0),
            rentEpoch: 0
        }),
        getSlot: vi.fn().mockResolvedValue(1000),
        getProgramAccounts: vi.fn().mockResolvedValue([])
    } as unknown as Connection;
}

/**
 * Creates test wallet for testing
 */
export function createTestWallet(): { publicKey: PublicKey; secretKey: Uint8Array } {
    const keypair = Keypair.generate();
    return {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey
    };
}

/**
 * Helper to simulate events
 */
export function emitEvent(context: PluginContext, event: ElizaEvent): void {
    context.events.emit(event.type, event);
}

/**
 * Helper to wait for async operations
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates test event data
 */
export function createTestEvent(type: string, data: any = {}): ElizaEvent {
    return {
        type,
        timestamp: Date.now(),
        data,
        metadata: {
            pluginId: 'test-plugin',
            version: '1.0.0'
        }
    };
}

/**
 * Verifies event was emitted with correct data
 */
export function verifyEventEmitted(
    context: PluginContext, 
    eventType: string,
    expectedData: any
): void {
    expect(context.events.emit).toHaveBeenCalledWith(
        eventType,
        expect.objectContaining({
            type: eventType,
            data: expectedData
        })
    );
}

/**
 * Setup test environment
 */
export async function setupTestEnv() {
    // Reset modules
    vi.resetModules();
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Setup test env variables
    process.env.TEST_MODE = 'true';
}

/**
 * Cleanup test environment
 */
export async function cleanupTestEnv() {
    vi.clearAllMocks();
    vi.clearAllTimers();
    
    // Cleanup env variables
    delete process.env.TEST_MODE;
}

/**
 * Assertion helpers
 */
export const assertions = {
    /**
     * Assert function was called with matching args
     */
    calledWithMatch(fn: jest.Mock, ...args: any[]) {
        expect(fn).toHaveBeenCalledWith(
            ...args.map(arg => 
                typeof arg === 'object' 
                    ? expect.objectContaining(arg)
                    : arg
            )
        );
    },

    /**
     * Assert async operation completes within timeout
     */
    async completesWithin(
        operation: () => Promise<any>,
        timeout: number
    ): Promise<void> {
        const timeoutPromise = delay(timeout)
            .then(() => { throw new Error('Operation timed out'); });
        
        await Promise.race([operation(), timeoutPromise]);
    }
};