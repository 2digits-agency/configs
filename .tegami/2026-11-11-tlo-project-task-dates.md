---
packages:
  '@2digits/tlo-mcp': minor
---

### Forward `CloseProjectTask` and `UpdateProject`

Agents can now close a project task, such as one added by mistake, and change a project's dates with `UpdateProject`. The gateway forwards Orbit's own tools with their schemas and write annotations, so Executor approves each call like the other writes.
