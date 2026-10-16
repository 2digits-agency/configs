---
packages: {}
---

## Update the agent skills

- Updated the Matt Pocock skills (`ask-matt`, `code-review`, `diagnosing-bugs`, `grilling`, `handoff`, `implement`, `setup-matt-pocock-skills`, `tdd`, `teach`, `to-tickets`, `wayfinder`) and the `gitbutler` skill, and updated `skills-lock.json` to match
- `ask-matt` now reads a skill's `SKILL.md` before describing it or recommending a step be skipped
- `diagnosing-bugs` checks that a forced red test really landed before trusting it, and hands off to `/retro` once a fix is in
- `code-review` runs its Standards and Spec sub-agents together in the foreground and checks for `CODING_STANDARDS.md` and `CONTRIBUTING.md`
- `gitbutler` documents `but init`, `-F` message files for `but commit` and `but squash`, and the current `but` version
- Added `.claude/skills` links for the `turborepo` and `wizard` skills, and for the other skills synced from `.agents/skills`
