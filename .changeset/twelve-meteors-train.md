---
'@2digits/tlo-mcp': minor
---

Add new MCP tools and improve tool descriptions for AI agents

- Added 6 new tools: `get_project_details`, `get_tasks`, `get_tasks_for_user`, `get_todo_detail`, `move_todo`, `post_message`
- Enhanced all 13 tool descriptions with workflow context, ID relationships, and usage hints
- Added parameter examples (e.g., duration: 60=1h, 90=1.5h) and source references (e.g., "from get_projects")
- Documented data hierarchy: FOLDER → PROJECT → TASK → ACTIVITY
- Replaced incorrect CLI README with TLO-MCP documentation
