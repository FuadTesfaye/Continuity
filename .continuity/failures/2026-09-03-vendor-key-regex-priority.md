---
id: 2026-09-03-vendor-key-regex-priority
title: Vendor Key Regex Priority
date: '2026-09-03'
relatedFiles:
  - src/core/security/redactor.ts
---
# Vendor Key Regex Priority

## Attempt
Placing general sk- prefix before vendor sk-ant-

## Result
Anthropic keys matched OpenAI regex first

## Why
Broad prefix was evaluated earlier in sequence

## Do Not Repeat
Never place broad regexes before specific vendor-prefixed regexes

## Better Approach
Order vendor-specific patterns first and add negative lookaheads

## Related Files
- src/core/security/redactor.ts
