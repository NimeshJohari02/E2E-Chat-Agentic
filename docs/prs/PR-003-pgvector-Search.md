# PR Review: Feature - pgvector Semantic Search

**PR**: #103
**Author**: Morgan (SDE-2)
**Reviewers**: Garrett (Principal), Marcus (Lead)
**Status**: Approved ✅

## Summary
Adds semantic search capabilities to FAQ engine using `pgvector` and OpenAI embeddings.
- Entity: Added `vector` column to `FaqEntity`
- Service: New `EmbeddingsService` with `text-embedding-3-small`
- Logic: Cosine distance search (`<=>`) in `FaqService`

## Review Comments

### Garrett (Principal)
> **[Database]** Direct usage of `createQueryBuilder` with raw SQL needed for vector op?
> **Morgan**: Yes, TypeORM doesn't natively support `<=>` vector operator yet.
> **Garrett**: Ensure we have an index on that column if FAQs grow > 1000.
> **Morgan**: Added TODO for IVFFlat index in DB migration.

### Marcus (Lead)
> **[Logic]** Fallback to L1 looks good if confidence < 0.7.
> **Question**: Error handling if OpenAI API is down?
> **Morgan**: Wrapped in try/catch, returns null -> falls back to L1 (which might also fail if AI is down, but graceful degradation is there).

## Outcome
**Approved** for merge into `release/1.0.0`. Validated against `chatbot-postgres` container.

## Backwards Compatibility
- [x] YES: New `vector` column is nullable. Existing queries work without embeddings.
- [ ] NO: Breaking change.

## Lead Approval
> **Marcus (Feature Lead)**:
> "Feature meets semantic search requirements. Database interactions approved by Garrett. Good fallback logic."
> **Verdict**: APPROVED ✅
