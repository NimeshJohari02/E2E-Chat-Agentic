# PRD-001: L0 Static Query Engine

**Author**: Sophia (Senior PM - Customer Experience)
**Status**: Draft
**Created**: 2026-01-13
**Target Traffic**: 40% of incoming queries

---

## Executive Summary

L0 Static Query Engine handles frequently asked questions through pattern matching and keyword-based routing. This tier deflects ~40% of traffic before reaching AI models or human agents, reducing costs and latency.

---

## User Stories

### US-001: FAQ Query Resolution
**As a** customer
**I want to** get instant answers to common questions
**So that** I don't have to wait for an agent

**Acceptance Criteria**:
- Response time < 100ms
- Configurable FAQ database (JSON/DB)
- Fuzzy matching for typos and variations
- Confidence threshold for routing to L1

### US-002: Admin FAQ Management
**As an** administrator
**I want to** add/edit/remove FAQ entries
**So that** I can keep responses current without code changes

**Acceptance Criteria**:
- CRUD API for FAQ entries
- Category/tag-based organization
- Bulk import/export (JSON format)
- Version history for audit

### US-003: Fallback Routing
**As a** system
**I want to** route low-confidence queries to L1
**So that** customers always get an answer

**Acceptance Criteria**:
- Configurable confidence threshold (default: 0.7)
- Query context passed to L1 for continuity
- Metrics on fallback rate

---

## Non-Functional Requirements (NFRs)

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Response Latency | p95 < 100ms | APM dashboard |
| Availability | 99.9% | Uptime monitoring |
| Throughput | 1000 req/sec | Load testing |
| Match Accuracy | > 85% | Weekly sampling audit |

---

## Success Metrics

- **Deflection Rate**: 40% of queries resolved at L0
- **Customer Satisfaction**: CSAT ≥ 4.0/5.0 for L0 responses
- **Resolution Time**: Average < 2 seconds including UI render

---

## Technical Specifications

### Data Model (Proposed by Garrett)
```typescript
interface FAQEntry {
  id: string;
  question: string;
  variations: string[];  // Alternative phrasings
  answer: string;
  category: string;
  tags: string[];
  priority: number;      // For ordering matches
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints (Proposed by Nathan)
```
POST   /api/v1/query          - Submit customer query
GET    /api/v1/faqs           - List all FAQs (admin)
POST   /api/v1/faqs           - Create FAQ entry
PUT    /api/v1/faqs/:id       - Update FAQ entry
DELETE /api/v1/faqs/:id       - Delete FAQ entry
POST   /api/v1/faqs/import    - Bulk import
GET    /api/v1/faqs/export    - Bulk export
```

---

## UAT Test Cases (Mia)

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| TC-001 | Query exactly matches FAQ | Return answer, confidence = 1.0 |
| TC-002 | Query has typo in keyword | Match via fuzzy search |
| TC-003 | Query matches multiple FAQs | Return highest priority match |
| TC-004 | Query has no match | Route to L1 with context |
| TC-005 | Empty query submitted | Return validation error |
| TC-006 | Admin creates new FAQ | Entry queryable immediately |

---

## Frontend TODO (Placeholder)

- [ ] FAQ search input component
- [ ] Response display card
- [ ] Typing indicator during processing
- [ ] "Was this helpful?" feedback buttons
- [ ] Admin FAQ management dashboard

---

## Rollout Strategy

1. **Phase 1**: Internal testing with seed FAQ data (50 entries)
2. **Phase 2**: Shadow mode - run L0 matching, always route to L1
3. **Phase 3**: 10% traffic with confidence > 0.9 only
4. **Phase 4**: Full rollout with 0.7 threshold
