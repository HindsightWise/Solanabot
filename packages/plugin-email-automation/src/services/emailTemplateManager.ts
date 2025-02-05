import { EmailTemplate, EmailBlock, GeneratedEmailContent } from '../types';
import Handlebars from 'handlebars';
import { emailFormatTemplate } from '../templates/emailFormat';

export class EmailTemplateManager {
    private templates: Map<string, EmailTemplate>;

    constructor() {
        this.templates = new Map();
        this.initializeTemplates();
        this.registerHandlebarsHelpers();
    }

    private initializeTemplates(): void {
        this.templates.set('default', this.createDefaultTemplate());
        this.templates.set('notification', this.createNotificationTemplate());
        this.templates.set('format', this.createFormatTemplate());
    }

    private createDefaultTemplate(): EmailTemplate {
        return {
            id: 'default',
            name: 'Default Template',
            html: this.loadDefaultTemplate(),
            variables: ['subject', 'blocks', 'signature'],
            defaultStyle: {
                container: this.loadDefaultStyles(),
                notification: ''
            }
        };
    }

    private loadDefaultTemplate(): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width">
                    <title>{{subject}}</title>
                    <style>{{{defaultStyle}}}</style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="content">
                            <h1>{{subject}}</h1>
                            {{#each blocks}}
                                {{{formatBlock this}}}
                            {{/each}}
                        </div>
                    </div>
                </body>
            </html>
        `.trim();
    }

    private registerHandlebarsHelpers(): void {
        this.registerFormatBlockHelper();
        this.registerPriorityBadgeHelper();
        this.registerUtilityHelpers();
    }

    private registerFormatBlockHelper(): void {
        Handlebars.registerHelper('formatBlock', (block: EmailBlock) => (
            new Handlebars.SafeString(this.formatBlock(block))
        ));
    }

    private formatBlock(block: EmailBlock): string {
        switch (block.type) {
            case 'paragraph':
                return this.formatParagraph(block);
            case 'bulletList':
                return this.formatBulletList(block);
            case 'heading':
                return this.formatHeading(block);
            default:
                return String(block.content || '');
        }
    }

    private formatParagraph(block: EmailBlock): string {
        return `<p class="paragraph">${block.content}</p>`;
    }

    private formatBulletList(block: EmailBlock): string {
        if (!block.content) return '';
        const items = Array.isArray(block.content) ? block.content : [block.content];
        return `
            <ul class="bullet-list">
                ${items.map(item => `<li>${item}</li>`).join('\n')}
            </ul>
        `;
    }

    private formatHeading(block: EmailBlock): string {
        return `<h2 class="heading">${block.content}</h2>`;
    }

    async renderEmail(content: GeneratedEmailContent): Promise<string> {
        const template = this.getTemplate(
            content.metadata.priority === 'high' ? 'notification' : 'default'
        );
        const compiledTemplate = Handlebars.compile(template.html);
        
        return compiledTemplate({
            subject: content.subject,
            blocks: content.blocks,
            metadata: content.metadata,
            defaultStyle: this.loadDefaultStyles()
        });
    }

    // Additional methods would continue with similar pattern of small,
    // focused functions with clear purposes
}