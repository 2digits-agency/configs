# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `2digits-agency/configs`. Use `gh` for issue operations.

## Conventions

Run commands inside this clone; `gh` infers the repository. Outside it, pass `--repo 2digits-agency/configs`.

- Create: `gh issue create --title "..." --body-file -` with a heredoc for multiline bodies.
- Read: `gh issue view <number> --comments`; fetch labels with `--json`.
- List: `gh issue list --state open --json number,title,body,labels,comments`; filter with `--label` and `--state`.
- Comment: `gh issue comment <number> --body "..."`
- Labels: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

“Publish to the issue tracker” means create a GitHub issue.
“Fetch the relevant ticket” means read the issue and its comments.

## Pull requests as a triage surface

**PRs as a request surface: no.**

If enabled later, triage external PRs with `gh pr` read/comment/label/close commands.
Keep authors with association `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`.
Use GitButler for branch publication and PR creation, as required by `AGENTS.md`.

GitHub shares issue and PR numbers. For ambiguous references, try `gh pr view <number>`, then `gh issue view <number>`.

## Wayfinding operations

- Map: one issue labelled `wayfinder:map`, containing Notes / Decisions-so-far / Fog.
- Child: link as a GitHub sub-issue; otherwise use a task list in the map and `Part of #<map>` in the child.
  Label children `wayfinder:<type>`: research, prototype, grilling, or task.
- Blocking: use native issue dependencies:
  `gh api --method POST repos/2digits-agency/configs/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
  Obtain database ids with `gh api repos/2digits-agency/configs/issues/<number> --jq .id`.
  If unavailable, put `Blocked by: #<number>` at the top of the child body.
- Frontier: first open child in map order with no open blockers and no assignee.
  Native `issue_dependencies_summary.blocked_by` counts open blockers.
- Claim: `gh issue edit <number> --add-assignee @me`, the session's first write.
- Resolve: comment with the answer, close the child, then append a summary and link to the map's Decisions-so-far.
