/**
 * AI Model Configuration
 *
 * SINGLE FILE SWAP: Change `provider` to switch models globally.
 * Supported providers: 'ollama' | 'openai' | 'anthropic' | 'cohere'
 */

export type ModelProvider = 'ollama' | 'openai' | 'anthropic' | 'cohere';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  options: {
    temperature: number;
    maxTokens?: number;
  };
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  options: {
    temperature: number;
    maxTokens?: number;
  };
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  options: {
    temperature: number;
    maxTokens?: number;
  };
}

export interface CohereConfig {
  apiKey: string;
  model: string;
  options: {
    temperature: number;
    maxTokens?: number;
  };
}

export interface FallbackConfig {
  enabled: boolean;
  order: ModelProvider[];
}

export interface ModelConfiguration {
  provider: ModelProvider;
  ollama: OllamaConfig;
  openai: OpenAIConfig;
  anthropic: AnthropicConfig;
  cohere: CohereConfig;
  fallback: FallbackConfig;
}

/**
 * CHANGE THIS FILE TO SWAP AI MODELS
 *
 * To switch providers:
 * 1. Change `provider` to your desired provider
 * 2. Ensure the provider config has correct settings
 * 3. Restart the application
 */
export const ModelConfig: ModelConfiguration = {
  // ========================================
  // ACTIVE PROVIDER - CHANGE THIS TO SWAP
  // ========================================
  provider: 'ollama',

  // ========================================
  // PROVIDER CONFIGURATIONS
  // ========================================

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2',
    options: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    options: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    options: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  },

  cohere: {
    apiKey: process.env.COHERE_API_KEY || '',
    model: process.env.COHERE_MODEL || 'command',
    options: {
      temperature: 0.7,
      maxTokens: 2048,
    },
  },

  // ========================================
  // FALLBACK CHAIN
  // ========================================
  fallback: {
    enabled: true,
    order: ['ollama', 'openai', 'anthropic'],
  },
};

export default ModelConfig;
