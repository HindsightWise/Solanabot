import { PluginContext, PluginMetadata, ElizaEvent } from '../types';

/**
 * Base class for Eliza plugins providing core integration patterns
 */
export abstract class BasePlugin {
    protected context: PluginContext;
    protected metadata: PluginMetadata;
    protected isInitialized: boolean = false;

    constructor(metadata: PluginMetadata) {
        this.metadata = metadata;
    }

    /**
     * Initialize plugin with given context
     * @param context - Plugin initialization context
     */
    async initialize(context: PluginContext): Promise<void> {
        this.context = context;
        
        // Register event handlers
        this.registerEventHandlers();
        
        // Custom initialization
        await this.onInitialize();
        
        this.isInitialized = true;
    }

    /**
     * Plugin specific initialization logic
     */
    protected abstract onInitialize(): Promise<void>;

    /**
     * Register plugin's event handlers
     */
    private registerEventHandlers(): void {
        this.context.events.on('beforeAction', this.handleBeforeAction.bind(this));
        this.context.events.on('afterAction', this.handleAfterAction.bind(this));
        this.context.events.on('error', this.handleError.bind(this));
    }

    /**
     * Handle pre-action events
     */
    protected async handleBeforeAction(event: ElizaEvent): Promise<void> {
        // Default implementation
    }

    /**
     * Handle post-action events
     */
    protected async handleAfterAction(event: ElizaEvent): Promise<void> {
        // Default implementation
    }

    /**
     * Handle error events
     */
    protected async handleError(error: Error): Promise<void> {
        // Default implementation
    }

    /**
     * Plugin cleanup
     */
    async destroy(): Promise<void> {
        // Cleanup resources
        await this.onDestroy();
        this.isInitialized = false;
    }

    /**
     * Plugin specific cleanup logic
     */
    protected abstract onDestroy(): Promise<void>;
}