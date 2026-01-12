/**
 * AI Model Provider Interface
 *
 * All model providers (Ollama, OpenAI, Anthropic, Cohere) must implement this interface.
 * This enables the factory pattern for easy model swapping.
 */

export interface ConversationContext {
  sessionId: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
  confidence?: number;
}

export interface ModelProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  model: string;
  options: {
    temperature: number;
    maxTokens?: number;
  };
}

/**
 * Abstract interface that all model providers must implement
 */
export interface AIModelProvider {
  /**
   * Provider name for identification
   */
  readonly name: string;

  /**
   * Generate a response from the AI model
   */
  generateResponse(prompt: string, context: ConversationContext): Promise<AIResponse>;

  /**
   * Check if the provider is healthy and available
   */
  healthCheck(): Promise<boolean>;

  /**
   * Estimate cost for a given number of tokens
   */
  estimateCost(tokens: number): number;
}
