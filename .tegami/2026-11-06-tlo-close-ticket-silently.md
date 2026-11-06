---
packages:
  '@2digits/tlo-mcp': minor
---

### Add `CloseTicketSilently`

The gateway now offers `CloseTicketSilently`, which closes a ticket without notifying the client. Until now agents could only close a ticket with `CloseTicket`, which sends the client a closing message. The tool takes the ticket number or the api_id. Like the other writes, each close is a single Orbit write that Executor approves separately.
