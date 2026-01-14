#!/bin/bash
API_BASE="http://localhost:8090/api/v1"

echo "🌱 Seeding Greeting Intent via API..."

curl -s -X POST "$API_BASE/faqs" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Hello",
    "answer": "Hello! I am your support assistant. You can ask me about password reset, account issues, or billing.",
    "category": "general",
    "tags": ["greeting", "start", "hi"],
    "variations": ["Hi", "Hey", "Greetings"],
    "isActive": true,
    "priority": 100
  }'

echo -e "\n✅ Seed Complete."
