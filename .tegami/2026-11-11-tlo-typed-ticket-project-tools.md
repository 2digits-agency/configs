---
packages:
  '@2digits/tlo-mcp': minor
---

### Typed ticket and project write tools

The gateway now defines `SetTicketOwner`, `LinkTicketToProject`, `CloseProjectTask` and `UpdateProject` itself instead of forwarding Orbit's untyped schemas, and adds `UpdateProjectTask` the same way. `SetTicketOwner` and `LinkTicketToProject` take a ticket number as well as an api_id, and `LinkTicketToProject` unlinks with `null`. `UpdateProject` and `UpdateProjectTask` take typed, documented fields instead of a `fieldsJson` string; `null` clears a field and `recurring` is a boolean. Moving task dates with `UpdateProjectTask` is what lets a project's end date move earlier. Every api_id parameter checks Orbit's type prefix, so a project api_id passed as a task, or a name passed as a user, is rejected before Orbit is called. Each call is still exactly one Orbit write, so Executor approves each one.
