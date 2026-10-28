---
packages:
  '@2digits/tlo-mcp': minor
---

### Add read-only composite tools

The gateway now offers three tools that combine several Orbit reads in one call and return typed `structuredContent`:

- `GetMyWorkday`: your timesheet for a day, week or range of up to 62 days. It lists entries with their locks, planned entries to confirm, gaps, overlaps and entries outside 09:00–17:30. It also returns absences, the running timer and bookable tasks with their remaining budget. Times are in Europe/Amsterdam.
- `GetTicketContext`: a ticket by number or api_id, closed tickets included, with its detail, conversation and your logged time.
- `GetBoardContext`: a board's columns, with their api_ids, and the cards in each column, optionally with card detail.

Writes stay separate Orbit tools, so each write is still approved on its own. If Orbit changes its text format, the composite fails with an error instead of returning wrong data.
