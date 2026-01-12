import { Injectable, Logger } from '@nestjs/common';
import type {
  AIResponse,
  ConversationContext,
  ModelProviderConfig,
} from './model-provider.interface';
import { AIModelProvider } from './model-provider.interface';

/**
 * Ollama Provider - Local LLM inference
 *
 * Connect to Ollama running locally at http://localhost:11434
 */
@Injectable()
export class OllamaProvider implements AIModelProvider {
  readonly name = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);

  constructor(private readonly config: ModelProviderConfig) {}

  async generateResponse(
    prompt: string,
    context: ConversationContext,
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build messages array from context
      const messages = context.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add current prompt
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: this.config.options.temperature,
            num_predict: this.config.options.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      return {
        content: data.message?.content || '',
        tokensUsed: {
          prompt: data.prompt_eval_count || 0,
          completion: data.eval_count || 0,
          total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        model: this.config.model,
        provider: this.name,
        latencyMs,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Ollama generation failed: ${errorMessage}`);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(tokens: number): number {
    // Ollama is local - no cost
    return 0;
  }
}
