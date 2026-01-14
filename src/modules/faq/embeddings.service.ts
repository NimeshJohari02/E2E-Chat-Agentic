import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('c'),
      modelName: 'text-embedding-3-small',
      // If we want to support Ollama later, we can factory pattern this
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // DEMO MODE: Bypass OpenAI if MOCK_AI is true or key is missing
    if (process.env.MOCK_AI === 'true' || !this.configService.get('OPENAI_API_KEY')) {
        this.logger.warn('Mocking embedding generation (MOCK_AI active or Missing Key)');
        return new Array(1536).fill(0.01); // Return dummy vector
    }

    try {
      // 1536 dimensions for text-embedding-3-small
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error: any) {
      if (error?.status === 401 || error?.code === 'invalid_api_key' || process.env.MOCK_AI === 'true') {
         this.logger.warn('OpenAI Auth failed, falling back to Mock Embedding');
         return new Array(1536).fill(0.01);
      }
      this.logger.error('Failed to generate embedding', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      this.logger.error('Failed to generate embeddings batch', error);
      throw error;
    }
  }
}
