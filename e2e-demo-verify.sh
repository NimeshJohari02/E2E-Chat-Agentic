#!/bin/bash

# Configuration
API_BASE="http://localhost:8090/api/v1"
NC='\033[0m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'

PASSED=0
FAILED=0

checkpoint() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "📍 CHECKPOINT: $1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

echo "E2E Demo Verification Starting..."

# 1. Greeting Test (FaqService Fix)
checkpoint "Greeting Flow (L0)"
echo "Testing: 'Hello' (Should match L0)"
res=$(curl -s -X POST "$API_BASE/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello there"}')

if echo "$res" | grep -q "Hello! I am your support assistant"; then
    echo -e "  ${GREEN}✅ PASSED: 'Hello' matched Greeting Intent (L0 via DB)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}❌ FAILED: Response did not contain expected answer${NC}"
    echo "  Response: $res"
    FAILED=$((FAILED + 1))
fi

# 2. Mock AI Fallback (Embeddings Fix)
checkpoint "Mock AI Fallback (MOCK_AI=true)"
# We assume MOCK_AI=true or Missing Key logic is active.
# Sending a query that won't match Exact/Greeting, forcing Semantic.
echo "Testing: 'How do I reset my password?' (Semantic Search with Mock Embeddings)"

# Note: With dummy embeddings (0.0), semantic search usually returns garbage or nothing if everything is 0.0 distance (identical).
# But if it returns *something* without crashing (500), it's a pass for "Resilience".
res_sem=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"How do I reset my password?"}')

status_code=$(echo "$res_sem" | tail -n1)
content=$(echo "$res_sem" | sed '$d')

if [ "$status_code" == "200" ]; then
    echo -e "  ${GREEN}✅ PASSED: Semantic Search returned 200 OK (didn't crash)${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}❌ FAILED: Semantic Search crashed or failed${NC}"
    echo "  Status: $status_code"
    echo "  Response: $content"
    FAILED=$((FAILED + 1))
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Total Passed: $PASSED | Total Failed: $FAILED"
if [ $FAILED -eq 0 ]; then exit 0; else exit 1; fi
