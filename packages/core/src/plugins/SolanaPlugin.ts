import { Connection, PublicKey } from '@solana/web3.js';
import { BasePlugin } from './BasePlugin';
import { PluginMetadata, ElizaEvent } from '../types';

interface SolanaPluginConfig {
    connection: Connection;
    endpoint: string;
    commitment?: string;
}

/**
 * Solana integration plugin for Eliza framework
 */
export class SolanaPlugin extends BasePlugin {
    private connection: Connection;
    private subscriptions: Map<string, number>;

    constructor(config: SolanaPluginConfig) {
        super({
            name: 'solana',
            version: '1.0.0',
            description: 'Solana blockchain integration'
        });

        this.connection = config.connection;
        this.subscriptions = new Map();
    }

    protected async onInitialize(): Promise<void> {
        // Validate connection
        await this.connection.getVersion();
        
        // Register capabilities
        this.context.registerCapability('getBalance', this.getBalance.bind(this));
        this.context.registerCapability('sendTransaction', this.sendTransaction.bind(this));
        this.context.registerCapability('subscribeAccount', this.subscribeAccount.bind(this));
    }

    protected async handleBeforeAction(event: ElizaEvent): Promise<void> {
        if (event.type === 'transaction') {
            await this.validateTransaction(event.data);
        }
    }

    protected async handleAfterAction(event: ElizaEvent): Promise<void> {
        if (event.type === 'transaction' && event.status === 'success') {
            await this.updateState(event.data);
        }
    }

    protected async handleError(error: Error): Promise<void> {
        // Log error to monitoring system
        console.error('Solana plugin error:', error);
    }

    private async validateTransaction(txData: any): Promise<void> {
        // Implement transaction validation logic
    }

    private async updateState(txData: any): Promise<void> {
        // Implement state update logic
    }

    async getBalance(address: string): Promise<number> {
        const pubkey = new PublicKey(address);
        const balance = await this.connection.getBalance(pubkey);
        return balance;
    }

    async sendTransaction(serializedTx: string): Promise<string> {
        // Implement transaction sending logic
        return 'tx_hash';
    }

    async subscribeAccount(address: string): Promise<number> {
        const pubkey = new PublicKey(address);
        const subscriptionId = this.connection.onAccountChange(
            pubkey,
            (account) => {
                this.context.events.emit('accountUpdate', {
                    address,
                    account
                });
            }
        );
        this.subscriptions.set(address, subscriptionId);
        return subscriptionId;
    }

    protected async onDestroy(): Promise<void> {
        // Cleanup subscriptions
        for (const [address, id] of this.subscriptions) {
            await this.connection.removeAccountChangeListener(id);
        }
        this.subscriptions.clear();
    }
}