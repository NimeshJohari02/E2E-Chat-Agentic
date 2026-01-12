import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { FaqEntity } from './entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto, QueryFaqDto, FaqResponseDto } from './dto/faq.dto';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  // Configurable confidence threshold for routing to L1
  private readonly confidenceThreshold = 0.7;

  constructor(
    @InjectRepository(FaqEntity)
    private readonly faqRepository: Repository<FaqEntity>,
  ) {}

  /**
   * Query FAQs and find the best match
   * Returns match with confidence score, or null if below threshold
   */
  async query(dto: QueryFaqDto): Promise<FaqResponseDto | null> {
    const { query, category } = dto;
    const normalizedQuery = query.toLowerCase().trim();

    // Step 1: Try exact match
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

    // Step 2: Try fuzzy match on variations
    const fuzzyMatch = await this.findFuzzyMatch(normalizedQuery, category);
    if (fuzzyMatch && fuzzyMatch.confidence >= this.confidenceThreshold) {
      this.logger.log(`Fuzzy match found for query: ${query} (confidence: ${fuzzyMatch.confidence})`);
      return fuzzyMatch;
    }

    // Step 3: No match above threshold - route to L1
    this.logger.log(`No match found for query: ${query}, routing to L1`);
    return null;
  }

  private async findExactMatch(query: string, category?: string): Promise<FaqEntity | null> {
    const whereCondition: FindOptionsWhere<FaqEntity> = {
      isActive: true,
    };

    if (category) {
      whereCondition.category = category;
    }

    // Check question field
    const exactQuestionMatch = await this.faqRepository.findOne({
      where: {
        ...whereCondition,
        question: ILike(query),
      },
    });

    if (exactQuestionMatch) {
      return exactQuestionMatch;
    }

    // Check variations (would need custom query for array contains)
    return null;
  }

  private async findFuzzyMatch(query: string, category?: string): Promise<FaqResponseDto | null> {
    // Simple keyword matching for now
    // TODO: Implement Levenshtein distance or pgvector semantic search
    const keywords = query.split(' ').filter(w => w.length > 2);

    if (keywords.length === 0) {
      return null;
    }

    const whereCondition: FindOptionsWhere<FaqEntity> = { isActive: true };
    if (category) {
      whereCondition.category = category;
    }

    const faqs = await this.faqRepository.find({
      where: whereCondition,
      order: { priority: 'DESC' },
    });

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

  // CRUD Operations for Admin

  async create(dto: CreateFaqDto): Promise<FaqEntity> {
    const faq = this.faqRepository.create(dto);
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
