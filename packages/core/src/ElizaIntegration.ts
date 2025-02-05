import { ElizaPlugin, PluginContext } from '@elizaos/core';
import { SolanaBot } from './SolanaBot';
import LocalEmbeddingModelManager from './localembeddingManager';

export class ElizaSolanaPlugin extends ElizaPlugin {
  private bot: SolanaBot;
  private embeddingManager: LocalEmbeddingModelManager;

  constructor() {
    super({
      name: 'solana-trading',
      version: '1.0.0'
    });
    
    this.embeddingManager = LocalEmbeddingModelManager.getInstance();
    this.bot = new SolanaBot();
  }

  async onLoad(context: PluginContext): Promise<void> {
    await this.embeddingManager.initialize();
    await this.bot.initialize();
    
    // Register plugin capabilities
    context.registerCapability('trading', {
      execute: async (data) => {
        return this.bot.executeTrade(data);
      }
    });

    context.registerCapability('marketData', {
      analyze: async (data) => {
        return this.bot.analyzeMarketData(data);
      }
    });
  }

  async onUnload(): Promise<void> {
    await this.bot.cleanup();
    await this.embeddingManager.reset();
  }
}