# @2digits/tlo-mcp

MCP (Model Context Protocol) server for TeamLeader Orbit (TLO) - project management and time tracking.

## Installation

```bash
pnpm add @2digits/tlo-mcp
```

## Usage

### As MCP Server

```bash
TLO_COOKIE="your-session-cookie" npx @2digits/tlo-mcp
```

### Configuration

Set the `TLO_COOKIE` environment variable to your TeamLeader Orbit session cookie.

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
