---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Reject invalid TLO calendar dates

- Rejected impossible dates and out-of-range times in `TloDateString` instead of silently normalizing them.
- Returned typed schema failures when `TloDate` conversion failed.
