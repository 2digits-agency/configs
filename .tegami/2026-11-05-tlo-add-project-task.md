---
packages:
  '@2digits/tlo-mcp': minor
---

### Add `AddProjectTask`

Agents can now add a task to a draft or open project, for example to book time on it. The gateway defines this tool itself instead of forwarding Orbit's, so its parameters are typed and documented:

- `startDate` and `endDate` must be existing `yyyy-MM-dd` dates, and `endDate` may not be before `startDate`.
- `assignees` is a list of user api_ids or names and group or division api_ids, instead of a comma-separated string.
- `billingMode` only accepts `ESTIMATE` or `HOURS`, `retainerId` an api_id or `NONE`, and hours and rates must be finite and not negative.

Invalid input is rejected before Orbit is called. The result returns the new task's `taskId`, so time can be booked on it right away. Each call is still exactly one Orbit write, so Executor approves every task separately. When a task ends after the project, Orbit moves the project's end date to the task's end date.

### Expose `ListRates`

The read-only `ListRates` tool is now forwarded, so agents can pick the matching rate card for `AddProjectTask`.
