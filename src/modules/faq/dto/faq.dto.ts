import { IsString, IsArray, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({
    description: 'The main question text',
    example: 'How do I reset my password?',
  })
  @IsString()
  question: string;

  @ApiPropertyOptional({
    description: 'Alternative phrasings of the question',
    example: ['forgot password', 'password reset', 'change my password'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variations?: string[];

  @ApiProperty({
    description: 'The answer to display to the customer',
    example: 'Go to Settings > Security > Reset Password. You will receive an email with reset instructions.',
  })
  @IsString()
  answer: string;

  @ApiProperty({
    description: 'Category for grouping FAQs',
    example: 'account',
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({
    description: 'Tags for search and filtering',
    example: ['password', 'security', 'account'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Keywords for search (legacy alias for tags)',
    example: ['password', 'security'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiPropertyOptional({
    description: 'Priority for matching (higher = preferred)',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether the FAQ is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ example: 'How do I reset my password?' })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variations?: string[];

  @ApiPropertyOptional({ example: 'Updated answer text' })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({ example: 'account' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryFaqDto {
  @ApiProperty({
    description: 'Customer query text',
    example: 'How do I reset my password?',
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'account',
  })
  @IsString()
  @IsOptional()
  category?: string;
}

export class FaqResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answer: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ minimum: 0, maximum: 1, example: 0.95 })
  confidence: number;

  @ApiProperty({ enum: ['exact', 'fuzzy', 'semantic'] })
  matchType: 'exact' | 'fuzzy' | 'semantic';
}

export class BulkImportFaqDto {
  @ApiProperty({
    description: 'Array of FAQs to import',
    type: [CreateFaqDto],
  })
  @IsArray()
  faqs: CreateFaqDto[];
}
