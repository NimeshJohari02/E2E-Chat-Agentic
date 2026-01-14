import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FaqEntity } from './entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto, QueryFaqDto, FaqResponseDto } from './dto/faq.dto';
import { EmbeddingsService } from './embeddings.service';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  // Configurable confidence threshold for routing to L1
  private readonly confidenceThreshold = 0.7;
  private readonly FAQ_CACHE_KEY = 'faqs:all';
  private readonly FAQ_CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(FaqEntity)
    private readonly faqRepository: Repository<FaqEntity>,
    private readonly embeddingsService: EmbeddingsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Query FAQs and find the best match
   * Returns match with confidence score, or null if below threshold
   */
  async query(dto: QueryFaqDto): Promise<FaqResponseDto | null> {
    const { query, category } = dto;
    const normalizedQuery = query.toLowerCase().trim();

    // ============================================
    // DEMO FIX: Explicitly handle Greetings
    // ============================================
    if (['hello', 'hi', 'hey', 'greetings', 'start', 'test'].some(w => normalizedQuery.includes(w)) && normalizedQuery.length < 20) {
      return {
        id: 'demo-greeting-id',
        question: 'Greeting',
        answer: 'Hello! I am your support assistant. You can ask me about password reset, account issues, or billing.',
        confidence: 1.0,
        matchType: 'exact',
      } as any;
    }

    // Step 1: Try exact match (Fastest & Most Accurate)
    const exactMatch = await this.findExactMatch(normalizedQuery, category);
    if (exactMatch) {
      this.logger.log(`Exact match found for query: ${query}`);
      return {
        id: exactMatch.id,
        question: exactMatch.question,
        answer: exactMatch.answer,
        category: exactMatch.category,
        confidence: 1.0,
        matchType: 'exact',
      };
    }

    // Step 2: Semantic match with embeddings
    const semanticMatch = await this.findSemanticMatch(normalizedQuery, category);
    if (semanticMatch && semanticMatch.confidence >= this.confidenceThreshold) {
      this.logger.log(`Semantic match found for query: ${query} (confidence: ${semanticMatch.confidence})`);
      return semanticMatch;
    }

    // Step 3: Try fuzzy match on variations (Fallback)
    const fuzzyMatch = await this.findFuzzyMatch(normalizedQuery, category);
    if (fuzzyMatch && fuzzyMatch.confidence >= this.confidenceThreshold) {
      this.logger.log(`Fuzzy match found for query: ${query} (confidence: ${fuzzyMatch.confidence})`);
      return fuzzyMatch;
    }

    this.logger.log(`No match found for query: ${query}, routing to L1`);
    return null;
  }

  private async findFuzzyMatch(query: string, category?: string): Promise<FaqResponseDto | null> {
    const keywords = query.split(' ').filter(w => w.length > 2);
    if (keywords.length === 0) return null;

    const whereCondition: FindOptionsWhere<FaqEntity> = { isActive: true };
    if (category) whereCondition.category = category;

    const faqs = await this.faqRepository.find({ where: whereCondition, order: { priority: 'DESC' } });
    let bestMatch: FaqEntity | null = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const faqText = `${faq.question} ${faq.variations.join(' ')}`.toLowerCase();
      const matchCount = keywords.filter(k => faqText.includes(k)).length;
      const score = matchCount / keywords.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    if (bestMatch && bestScore >= this.confidenceThreshold) {
      return {
        id: bestMatch.id,
        question: bestMatch.question,
        answer: bestMatch.answer,
        category: bestMatch.category,
        confidence: bestScore,
        matchType: 'fuzzy',
      };
    }
    return null;
  }

  private async findExactMatch(query: string, category?: string): Promise<FaqEntity | null> {
    const whereCondition: FindOptionsWhere<FaqEntity> = {
      isActive: true,
    };

    if (category) {
      whereCondition.category = category;
    }

    // Check question field case-insensitive
    return this.faqRepository.findOne({
      where: {
        ...whereCondition,
        question: ILike(query),
      },
    });
  }

  private async findSemanticMatch(query: string, category?: string): Promise<FaqResponseDto | null> {
    try {
      const embedding = await this.embeddingsService.generateEmbedding(query);
      const embeddingString = `[${embedding.join(',')}]`;

      // Set IVFFlat probes for better accuracy/speed tradeoff
      await this.faqRepository.query('SET ivfflat.probes = 10');

      // Use TypeORM raw query for pgvector cosine distance
      // operator <=> is cosine distance (uses IVFFlat index if available)
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
    // Legacy support: Map keywords to tags
    if (dto.keywords && dto.keywords.length > 0) {
      dto.tags = [...(dto.tags || []), ...dto.keywords];
    }

    const faq = this.faqRepository.create(dto);

    // Generate embedding
    try {
      const textToEmbed = `${dto.question} ${dto.variations?.join(' ') || ''} ${dto.tags?.join(' ') || ''}`;
      faq.embedding = await this.embeddingsService.generateEmbedding(textToEmbed);
    } catch (e) {
      this.logger.warn(`Failed to generate embedding for FAQ: ${dto.question}`);
    }

    // Invalidate cache
    await this.cacheManager.del(this.FAQ_CACHE_KEY);

    return this.faqRepository.save(faq);
  }

  async findAll(): Promise<FaqEntity[]> {
    // Check cache first
    const cached = await this.cacheManager.get<FaqEntity[]>(this.FAQ_CACHE_KEY);
    if (cached) {
      this.logger.log('FAQs served from cache');
      return cached;
    }

    // Fetch from DB and cache
    const faqs = await this.faqRepository.find({
      order: { category: 'ASC', priority: 'DESC' },
    });

    await this.cacheManager.set(this.FAQ_CACHE_KEY, faqs, this.FAQ_CACHE_TTL);
    this.logger.log('FAQs fetched from DB and cached');
    return faqs;
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
    const entities = [];
    for (const dto of faqs) {
        // Legacy support mapping
        if (dto.keywords && dto.keywords.length > 0) {
            dto.tags = [...(dto.tags || []), ...dto.keywords];
        }

        const faq = this.faqRepository.create(dto);
        // Best effort embedding generation for bulk import
        try {
            const textToEmbed = `${dto.question} ${dto.variations?.join(' ') || ''} ${dto.tags?.join(' ') || ''}`;
            faq.embedding = await this.embeddingsService.generateEmbedding(textToEmbed);
        } catch (e) {
             // Continue without embedding
        }
        entities.push(faq);
    }

    await this.cacheManager.del(this.FAQ_CACHE_KEY);
    return this.faqRepository.save(entities);
  }

  async export(): Promise<FaqEntity[]> {
    return this.findAll();
  }
}
