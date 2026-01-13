# PR-010: IVFFlat Index for pgvector Semantic Search

**Author**: Garrett (Principal - Deep Infrastructure)
**Reviewers**: Morgan (SDE-2 - AI Systems), Nathan (Principal)
**Status**: In Progress

## Problem Description
The current `pgvector` semantic search uses sequential scan (`<=>` cosine distance). This is O(n) and will degrade significantly at >1000 FAQs.

**Current Behavior**:
```sql
SELECT * FROM faq ORDER BY embedding <=> '[...]' LIMIT 1;
-- Sequential scan: 50ms at 100 rows, ~500ms at 1000 rows
```

## Proposed Changes
1.  **Migration**: Create TypeORM migration to add IVFFlat index on `FaqEntity.embedding`.
2.  **Index Configuration**:
    - `lists`: 100 (for datasets up to 100k rows)
    - `probes`: 10 (accuracy/speed tradeoff)
3.  **Query Adjustment**: Set `SET ivfflat.probes = 10` before search queries.

## Backwards Compatibility
- [x] YES: Index creation is additive. Existing queries work unchanged.
- [ ] NO: Breaking change.

## Verification Plan
- **Manual**: `EXPLAIN ANALYZE` on query to confirm index scan vs seq scan.
- **Benchmark**: Compare query time before/after index.

## Lead Approval
> **Nathan (Principal)**:
> "Migration is clean and follows TypeORM conventions. IVFFlat with lists=100 is appropriate for our scale. Setting probes at query time is correct approach."
> **Verdict**: APPROVED ✅
