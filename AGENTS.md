<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Agent Guidelines for @2digits/configs

## Build/Lint/Test Commands

- **Build all packages**: `turbo run build` or `pnpm build`
- **Run all tests**: `turbo test` or `pnpm test` (uses Vitest)
- **Run single test**: `vitest --run` (in package directory)
- **Lint all**: `pnpm lint` (ESLint + manypkg)
- **Type check**: `turbo types` or `pnpm types`
- **Format check**: `pnpm format` (Prettier)
- **Full check**: `pnpm check` (test + lint + types + format + knip)
- **Fix linting**: `pnpm lint:fix`
- **Fix formatting**: `pnpm format:fix`

## Code Style Guidelines

### TypeScript

- Target: ES2022, Modules: ESNext with Bundler resolution
- Strict mode enabled, no implicit returns/overrides
- JSX: react-jsx transform
- No unused locals/parameters, strict typing
- Verbatim module syntax, erasable syntax only

### Imports

- Built-ins → React → Next.js → Expo → Third-party → @2digits → @/ → Scoped → JSON → Relative
- Use single quotes, trailing commas
- Import order enforced via @ianvs/prettier-plugin-sort-imports

### Formatting

- Print width: 120, bracketSameLine: true
- Single quotes, trailing commas: all
- Experimental operator position: start

### Linting

- ESLint with TypeScript, React, Unicorn, SonarJS, and more
- Comprehensive rules for code quality and consistency
- Uses @2digits/eslint-config with framework-specific options

### Testing

- Vitest framework with --run flag for CI
- Snapshot testing for fixtures
- Timeout handling for long-running tests

### Building

- tsdown for TypeScript compilation and minification
- ESM output with .mjs/.d.mts extensions
- Side-effect free packages

### Error Handling

- Use TypeScript strict mode for compile-time safety
- ESLint catches potential runtime errors
- Knip for unused dependency detection

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
bd create "Subtask" --parent <epic-id> --json  # Hierarchical subtask (gets ID like epic-id.1)
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### CLI Help

Run `bd <command> --help` to see all available flags for any command.
For example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
