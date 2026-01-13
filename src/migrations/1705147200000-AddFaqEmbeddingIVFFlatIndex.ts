import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add IVFFlat Index for FAQ Embeddings
 *
 * This migration creates an IVFFlat index on the FAQ entity's embedding column
 * to accelerate cosine similarity searches using pgvector.
 *
 * IVFFlat Parameters:
 * - lists: 100 (optimal for datasets up to ~100k rows)
 * - Probes should be set at query time via: SET ivfflat.probes = 10
 *
 * Performance Impact:
 * - Before: O(n) sequential scan
 * - After: O(sqrt(n)) approximate nearest neighbor
 */
export class AddFaqEmbeddingIVFFlatIndex1705147200000 implements MigrationInterface {
  name = 'AddFaqEmbeddingIVFFlatIndex1705147200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure pgvector extension exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Create IVFFlat index with cosine distance operator
    // The index must be created AFTER data is inserted for optimal performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_faq_embedding_ivfflat"
      ON "faq"
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    console.log('✅ IVFFlat index created on faq.embedding');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_faq_embedding_ivfflat"`);
    console.log('❌ IVFFlat index dropped from faq.embedding');
  }
}
