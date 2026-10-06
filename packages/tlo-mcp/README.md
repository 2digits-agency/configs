# @2digits/tlo-mcp

Local MCP proxy for Teamleader Orbit. OAuth runs locally; your MCP client only needs stdio.

## Installation

```bash
vp add @2digits/tlo-mcp
```

## Usage

### Login once

```bash
vp exec tlo-mcp login
```

Login opens your browser and listens on an ephemeral `127.0.0.1` callback. Each login uses fresh state and PKCE S256.
The proxy registers its own OAuth client; never reuse an existing authorization URL or another application's client ID.

### Start the MCP server

```bash
vp exec tlo-mcp
```

Configure your MCP client to run `tlo-mcp` without arguments, or `node /absolute/path/to/dist/bin.mjs`.
No OAuth configuration, cookies or tokens belong in the client's config.

- Tools, descriptions, input/output schemas and annotations are discovered from the official MCP, including all pages.
- Access tokens refresh before expiry; rotated refresh tokens are saved before use.
- Official server instructions, tool content, structured results and `isError` are preserved.
- JSON and SSE responses are supported. Tool calls are never automatically replayed after failures or rate limits.
- Only tools are proxied; resources, prompts, sampling and upstream notification subscriptions are not currently forwarded.
- Tool discovery runs at startup; restart the proxy to discover changes upstream.
- Orbit's own availability and account permissions still apply.

### Credentials and logout

macOS stores credentials in Keychain under `@2digits/tlo-mcp/orbit`; Keychain errors never fall back to plaintext.
Other platforms use `~/.config/2digits/tlo-mcp/session.json` with file mode `0600` and directory mode `0700`.
Windows ACL hardening is not provided; restrict access to your user profile.
Tokens never appear in process arguments or normal stdout. MCP diagnostics go to stderr.

```bash
vp exec tlo-mcp logout
```

Logout deletes local credentials; it does not revoke the upstream grant (Orbit advertises no revocation endpoint).
Concurrent refresh/login is protected by a local lock. After a crashed process, confirm it is no longer running before
removing `~/.config/2digits/tlo-mcp/session.lock`. Do not remove a live process's lock.

### Legacy cookie adapter

The previous 14-tool adapter remains available explicitly:

```bash
TLO_SESSION_TOKEN="your-session-token" TLO_COOKIES="session=..." vp exec tlo-mcp legacy
```

`TLO_BASE_URL` defaults to `https://socialbrothers.orbit.teamleader.eu`.
The following data model and tool names apply to **legacy mode only**.

## Data Model

```text
FOLDER (workspace, e.g., "2DIGITS | Projects")
  └── PROJECT (e.g., "I amsterdam | doorontwikkeling")
       ├── TASK (work items with budget/workload)
       │    └── ACTIVITY (time entries)
       └── BOARD (kanban)
            └── BOARDLIST (column)
                 └── TODO (card)
```

### Key IDs

- `folderId` - Workspace containing projects
- `projectId` - Project within a folder
- `taskId` - Work item within project
- `todoId` - Kanban card
- `contactId` - User identifier

## Available Tools

### Projects

| Tool                  | Description                                         |
| --------------------- | --------------------------------------------------- |
| `get_projects`        | List all projects with client, owner, dates, budget |
| `get_project_details` | Get single project with billing rates               |
| `get_tasks`           | Get tasks within a project                          |
| `get_tasks_for_user`  | Get tasks assigned to a user                        |
| `set_task_state`      | Change task state (DRAFT/OPEN/COMPLETED/CLOSED)     |

### Time Tracking

| Tool                  | Description                     |
| --------------------- | ------------------------------- |
| `get_week_activities` | Get all time entries for a week |
| `create_activity`     | Log time against project/task   |
| `update_activity`     | Modify existing time entry      |
| `delete_activity`     | Remove time entry               |

### Kanban

| Tool              | Description                            |
| ----------------- | -------------------------------------- |
| `get_todo_detail` | Get kanban card with columns and links |
| `move_todo`       | Move card between columns              |

### Messages

| Tool           | Description                        |
| -------------- | ---------------------------------- |
| `get_messages` | Get comments on project/board/todo |
| `post_message` | Add comment to project/board/todo  |

## Common Workflows

### View someone's week

```text
get_week_activities(date: "2025-01-20", contactId: "1699127")
```

### Log time

```text
1. get_projects() → find folderId
2. get_tasks(projectId) → optionally find taskId
3. create_activity(folderId, startDate, durationMinutes, contactId)
```

### Move kanban card

```text
1. get_todo_detail(todoId) → get boardId and BOARDLISTS
2. move_todo(id, boardId, boardListId, sortIndex: 0)
```

## License

MIT
