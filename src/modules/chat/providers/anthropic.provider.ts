import { Injectable, Logger } from '@nestjs/common';
import type {
  AIResponse,
  ConversationContext,
  ModelProviderConfig,
} from './model-provider.interface';
import { AIModelProvider } from './model-provider.interface';

/**
 * Anthropic Provider - Claude models
 */
@Injectable()
export class AnthropicProvider implements AIModelProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);

  // Pricing per 1K tokens (approximate)
  private readonly pricing = {
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  };

  constructor(private readonly config: ModelProviderConfig) {}

  async generateResponse(
    prompt: string,
    context: ConversationContext,
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const messages = context.messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));

      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.options.maxTokens || 2048,
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic request failed: ${error}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        content: data.content[0]?.text || '',
        tokensUsed: {
          prompt: data.usage?.input_tokens || 0,
          completion: data.usage?.output_tokens || 0,
          total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        model: this.config.model,
        provider: this.name,
        latencyMs,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Anthropic generation failed: ${errorMessage}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    // Anthropic doesn't have a simple health check endpoint
    // We just verify the API key is set
    return !!this.config.apiKey;
  }

  estimateCost(tokens: number): number {
    const model = this.config.model.includes('opus')
      ? 'claude-3-opus'
      : this.config.model.includes('haiku')
      ? 'claude-3-haiku'
      : 'claude-3-sonnet';
    const modelPricing = this.pricing[model];
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;
    return (tokens / 1000) * avgPrice;
  }
}
