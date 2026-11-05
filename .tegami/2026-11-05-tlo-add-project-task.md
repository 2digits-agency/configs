---
packages:
  '@2digits/tlo-mcp': minor
---

### Expose `AddProjectTask`

The gateway now forwards Orbit's `AddProjectTask`, so agents can add a task to a draft or open project. Like the other writes, each call is a separate Orbit tool call that Executor approves on its own. Orbit may extend the project's end date to the task's end date.
