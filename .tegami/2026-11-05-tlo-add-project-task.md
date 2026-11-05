---
packages:
  '@2digits/tlo-mcp': minor
---

### Add `AddProjectTask`

Agents can now add a task to a draft or open project, for example to book time on it. The gateway defines this tool itself instead of forwarding Orbit's, so its parameters are typed and documented:

- `startDate` and `endDate` must be existing `yyyy-MM-dd` dates, and `endDate` may not be before `startDate`.
- `projectId` takes an api_id or a project number.
- `assignees` is a list of api_ids (user, group or division) or unique user names, instead of a comma-separated string.
- `retainerId` is an api_id, or `null` for no retainer. `billingMode` only accepts `ESTIMATE` or `HOURS`, `workloadHours` must be finite and not negative, and `rate` finite and above 0 (use `nonBillable` for unbilled work).

Invalid input is rejected before Orbit is called. The result returns the new task's `taskId`, so time can be booked on it right away. Each call is still exactly one Orbit write, so Executor approves every task separately. When a task ends after the project, Orbit moves the project's end date to the task's end date.

### Show the api_id pattern in tool schemas

Tool input and output schemas now include the 15-character pattern of Orbit api_ids, so clients can check ids before calling.

### Expose `ListRates`

The read-only `ListRates` tool is now forwarded, so agents can pick the matching rate card for `AddProjectTask`.
