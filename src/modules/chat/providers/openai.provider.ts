import { Injectable, Logger } from '@nestjs/common';
import type {
  AIResponse,
  ConversationContext,
  ModelProviderConfig,
} from './model-provider.interface';
import { AIModelProvider } from './model-provider.interface';

/**
 * OpenAI Provider - GPT models
 */
@Injectable()
export class OpenAIProvider implements AIModelProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAIProvider.name);

  // Pricing per 1K tokens (approximate)
  private readonly pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  };

  constructor(private readonly config: ModelProviderConfig) {}

  async generateResponse(
    prompt: string,
    context: ConversationContext,
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const messages = context.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messages.push({ role: 'user', content: prompt });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.options.temperature,
          max_tokens: this.config.options.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI request failed: ${error}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        content: data.choices[0]?.message?.content || '',
        tokensUsed: {
          prompt: data.usage?.prompt_tokens || 0,
          completion: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        model: this.config.model,
        provider: this.name,
        latencyMs,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OpenAI generation failed: ${errorMessage}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(tokens: number): number {
    const modelPricing = this.pricing[this.config.model] || this.pricing['gpt-4'];
    // Assume 50/50 split between input/output for estimation
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;
    return (tokens / 1000) * avgPrice;
  }
}
