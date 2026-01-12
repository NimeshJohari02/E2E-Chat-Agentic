import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto, UpdateFaqDto, QueryFaqDto, BulkImportFaqDto } from './dto/faq.dto';

@ApiTags('FAQ')
@Controller('api/v1')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  /**
   * L0 Query Endpoint - Customer facing
   * Returns matched FAQ or null (for L1 routing)
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query FAQ (L0 Static Matching)',
    description: 'Customer-facing endpoint. Matches query against FAQ database and returns answer if confidence >= 0.7, otherwise signals to route to L1 AI.',
  })
  @ApiBody({ type: QueryFaqDto })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            tier: { type: 'string', example: 'L0' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                question: { type: 'string', example: 'How do I reset my password?' },
                answer: { type: 'string', example: 'Go to Settings > Security > Reset Password' },
                confidence: { type: 'number', example: 1.0 },
                matchType: { type: 'string', enum: ['exact', 'fuzzy', 'semantic'] },
              },
            },
          },
        },
        {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            tier: { type: 'string', example: 'L0' },
            routeTo: { type: 'string', example: 'L1' },
            message: { type: 'string' },
          },
        },
      ],
    },
  })
  async query(@Body() dto: QueryFaqDto) {
    const result = await this.faqService.query(dto);

    if (result) {
      return {
        success: true,
        tier: 'L0',
        data: result,
      };
    }

    // No match - signal to route to L1
    return {
      success: false,
      tier: 'L0',
      routeTo: 'L1',
      message: 'Query could not be matched with sufficient confidence',
    };
  }

  // ============================================
  // Admin CRUD Endpoints
  // ============================================

  @Get('faqs')
  @ApiOperation({
    summary: 'Get all FAQs',
    description: 'Admin endpoint. Returns all FAQ entries.',
  })
  @ApiResponse({ status: 200, description: 'List of all FAQs' })
  async findAll() {
    return this.faqService.findAll();
  }

  @Get('faqs/:id')
  @ApiOperation({
    summary: 'Get FAQ by ID',
    description: 'Admin endpoint. Returns a single FAQ by ID.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'FAQ found' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Post('faqs')
  @ApiOperation({
    summary: 'Create FAQ',
    description: 'Admin endpoint. Creates a new FAQ entry.',
  })
  @ApiBody({ type: CreateFaqDto })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateFaqDto) {
    return this.faqService.create(dto);
  }

  @Put('faqs/:id')
  @ApiOperation({
    summary: 'Update FAQ',
    description: 'Admin endpoint. Updates an existing FAQ.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateFaqDto })
  @ApiResponse({ status: 200, description: 'FAQ updated successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqService.update(id, dto);
  }

  @Delete('faqs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete FAQ',
    description: 'Admin endpoint. Deletes an FAQ entry.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'FAQ deleted successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async remove(@Param('id') id: string) {
    await this.faqService.remove(id);
  }

  @Post('faqs/import')
  @ApiOperation({
    summary: 'Bulk import FAQs',
    description: 'Admin endpoint. Imports multiple FAQ entries at once.',
  })
  @ApiBody({ type: BulkImportFaqDto })
  @ApiResponse({ status: 201, description: 'FAQs imported successfully' })
  async bulkImport(@Body() dto: BulkImportFaqDto) {
    return this.faqService.bulkImport(dto.faqs);
  }

  @Get('faqs/export')
  @ApiOperation({
    summary: 'Export all FAQs',
    description: 'Admin endpoint. Exports all FAQs in JSON format.',
  })
  @ApiResponse({ status: 200, description: 'FAQs exported successfully' })
  async export() {
    return this.faqService.export();
  }
}
