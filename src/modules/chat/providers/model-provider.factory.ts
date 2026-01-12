import { Injectable, Logger } from '@nestjs/common';
import { ModelConfig, ModelProvider } from '../../../config/models.config';
import { AIModelProvider } from './model-provider.interface';
import { OllamaProvider } from './ollama.provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';

/**
 * Model Provider Factory
 *
 * Creates the appropriate AI model provider based on configuration.
 * Implements fallback chain when primary provider is unavailable.
 */
@Injectable()
export class ModelProviderFactory {
  private readonly logger = new Logger(ModelProviderFactory.name);
  private readonly providers: Map<ModelProvider, AIModelProvider> = new Map();
  private activeProvider: AIModelProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize all configured providers
    this.providers.set(
      'ollama',
      new OllamaProvider({
        baseUrl: ModelConfig.ollama.baseUrl,
        model: ModelConfig.ollama.model,
        options: ModelConfig.ollama.options,
      }),
    );

    this.providers.set(
      'openai',
      new OpenAIProvider({
        apiKey: ModelConfig.openai.apiKey,
        model: ModelConfig.openai.model,
        options: ModelConfig.openai.options,
      }),
    );

    this.providers.set(
      'anthropic',
      new AnthropicProvider({
        apiKey: ModelConfig.anthropic.apiKey,
        model: ModelConfig.anthropic.model,
        options: ModelConfig.anthropic.options,
      }),
    );

    // Set active provider from config
    this.activeProvider = this.providers.get(ModelConfig.provider) || null;
    this.logger.log(`Active AI provider: ${ModelConfig.provider}`);
  }

  /**
   * Get the currently active provider
   */
  getActiveProvider(): AIModelProvider {
    if (!this.activeProvider) {
      throw new Error('No active AI provider configured');
    }
    return this.activeProvider;
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: ModelProvider): AIModelProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get a healthy provider with fallback chain
   */
  async getHealthyProvider(): Promise<AIModelProvider> {
    // Try active provider first
    if (this.activeProvider) {
      const isHealthy = await this.activeProvider.healthCheck();
      if (isHealthy) {
        return this.activeProvider;
      }
      this.logger.warn(`Primary provider ${this.activeProvider.name} is unhealthy`);
    }

    // Try fallback chain
    if (ModelConfig.fallback.enabled) {
      for (const providerName of ModelConfig.fallback.order) {
        const provider = this.providers.get(providerName);
        if (provider) {
          const isHealthy = await provider.healthCheck();
          if (isHealthy) {
            this.logger.log(`Falling back to ${providerName}`);
            return provider;
          }
        }
      }
    }

    throw new Error('No healthy AI provider available');
  }

  /**
   * Switch active provider (for admin hot-swap)
   */
  switchProvider(name: ModelProvider): void {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }
    this.activeProvider = provider;
    this.logger.log(`Switched active provider to: ${name}`);
  }

  /**
   * Get health status of all providers
   */
  async getAllProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      try {
        health[name] = await provider.healthCheck();
      } catch {
        health[name] = false;
      }
    }

    return health;
  }
}
