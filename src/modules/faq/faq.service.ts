import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { FaqEntity } from './entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto, QueryFaqDto, FaqResponseDto } from './dto/faq.dto';
import { EmbeddingsService } from './embeddings.service';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  // Configurable confidence threshold for routing to L1
  private readonly confidenceThreshold = 0.7;

  constructor(
    @InjectRepository(FaqEntity)
    private readonly faqRepository: Repository<FaqEntity>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Query FAQs and find the best match
   * Returns match with confidence score, or null if below threshold
   */
  async query(dto: QueryFaqDto): Promise<FaqResponseDto | null> {
    const { query, category } = dto;
    const normalizedQuery = query.toLowerCase().trim();

    // Step 1: Semantic match with embeddings
    const semanticMatch = await this.findSemanticMatch(normalizedQuery, category);
    if (semanticMatch && semanticMatch.confidence >= this.confidenceThreshold) {
      this.logger.log(`Semantic match found for query: ${query} (confidence: ${semanticMatch.confidence})`);
      return semanticMatch;
    }

    // Fallback logic could go here
    this.logger.log(`No match found for query: ${query}, routing to L1`);
    return null;
  }

  private async findSemanticMatch(query: string, category?: string): Promise<FaqResponseDto | null> {
    try {
      const embedding = await this.embeddingsService.generateEmbedding(query);
      const embeddingString = `[${embedding.join(',')}]`;

      // Use TypeORM raw query for pgvector cosine distance
      // operator <=> is cosine distance
      const queryBuilder = this.faqRepository.createQueryBuilder('faq')
        .select([
            'faq.id',
            'faq.question',
            'faq.answer',
            'faq.category',
            '(faq.embedding <=> :embedding) as distance'
        ])
        .where('faq.isActive = :isActive', { isActive: true })
        .setParameter('embedding', embeddingString)
        .orderBy('distance', 'ASC')
        .limit(1);

      if (category) {
        queryBuilder.andWhere('faq.category = :category', { category });
      }

      const result = await queryBuilder.getRawOne();

      if (result) {
        // Convert distance to similarity score (0 to 1)
        // distance is 0 for identical, approaches 2 for opposite
        const distance = parseFloat(result.distance);
        const confidence = 1 - (distance / 2); // Approximation

        return {
          id: result.faq_id,
          question: result.faq_question,
          answer: result.faq_answer,
          category: result.faq_category,
          confidence,
          matchType: 'semantic',
        };
      }
      return null;
    } catch (error) {
      this.logger.error('Error during semantic search', error);
      return null;
    }
  }

  // CRUD Operations for Admin

  async create(dto: CreateFaqDto): Promise<FaqEntity> {
    const faq = this.faqRepository.create(dto);

    // Generate embedding
    try {
      const textToEmbed = `${dto.question} ${dto.variations?.join(' ') || ''}`;
      faq.embedding = await this.embeddingsService.generateEmbedding(textToEmbed);
    } catch (e) {
      this.logger.warn(`Failed to generate embedding for FAQ: ${dto.question}`);
    }

    return this.faqRepository.save(faq);
  }

  async findAll(): Promise<FaqEntity[]> {
    return this.faqRepository.find({
      order: { category: 'ASC', priority: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FaqEntity> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ with id ${id} not found`);
    }
    return faq;
  }

  async update(id: string, dto: UpdateFaqDto): Promise<FaqEntity> {
    const faq = await this.findOne(id);
    Object.assign(faq, dto);
    return this.faqRepository.save(faq);
  }

  async remove(id: string): Promise<void> {
    const faq = await this.findOne(id);
    await this.faqRepository.remove(faq);
  }

  async bulkImport(faqs: CreateFaqDto[]): Promise<FaqEntity[]> {
    const entities = faqs.map(dto => this.faqRepository.create(dto));
    return this.faqRepository.save(entities);
  }

  async export(): Promise<FaqEntity[]> {
    return this.findAll();
  }
}
