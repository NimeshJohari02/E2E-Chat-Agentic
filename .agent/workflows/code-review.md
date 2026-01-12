---
description: Code review process for all changes
---

# Code Review Workflow

All code changes must go through this review process before being merged.

## Review Chain

Changes must be approved in this order:
1. **Senior Engineer** (Alex, Jordan, or Riley)
2. **Lead Engineer** (Sarah or Marcus)
3. **Principal Architect** (Garrett for infra/DB, Nathan for API/patterns)

## Steps

1. Create a Pull Request with:
   - Descriptive title following: `[MODULE] Brief description`
   - Link to related PRD or task
   - Summary of changes
   - Testing completed (local test workflow)

2. Request review from appropriate **Senior Engineer**:
   - Core backend (auth, users) → Alex
   - Third-party integrations → Jordan
   - Metrics/analytics → Riley
   - AI/ML components → Morgan or River

3. After Senior approval, request **Lead Engineer** review:
   - Platform services → Sarah
   - Feature services → Marcus

4. After Lead approval, request **Principal Architect** review:
   - Database changes, infrastructure → Garrett
   - API contracts, service patterns → Nathan
   - *Both* review major architectural changes

5. Merge only after all required approvals.

## Review Checklist

### Senior Review Focus
- [ ] Code follows module patterns
- [ ] Unit tests cover new code
- [ ] No obvious bugs or logic errors
- [ ] Error handling is proper

### Lead Review Focus
- [ ] Aligns with PRD requirements
- [ ] Integration tests pass
- [ ] No cross-team conflicts
- [ ] Documentation updated

### Principal Review Focus
- [ ] Garrett: Database schema correct, migrations safe
- [ ] Nathan: API contracts follow standards, patterns correct
- [ ] Both: No architectural violations

## Emergency Hotfix Process

For production-critical fixes only:
1. Create PR with `[HOTFIX]` prefix
2. One Principal can approve directly
3. Retroactive full review required within 24 hours
