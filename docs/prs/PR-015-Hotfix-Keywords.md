# PR-015: Hotfix - Fix Create FAQ 400 Error (Missing Keywords)

**Author**: Marcus (Feature Lead)
**Status**: In Progress
**Branch**: `hotfix/marcus/fix-create-faq-keywords`

## Problem
`POST /api/v1/faqs` returns `400 Bad Request` with `property keywords should not exist`.
The `CreateFaqDto` was missing the `keywords` property, which is used in the API contract (Postman).

## Solution
1.  Add `keywords` to `CreateFaqDto` (mapped to `tags`).
2.  Update `FaqService` to accept `keywords`.

## Backwards Compatibility
- [x] YES: Strictly additive.

## Lead Approval
*(Pending Review - Self/Peer)*
