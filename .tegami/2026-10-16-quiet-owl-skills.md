---
packages:
  'npm:@2digits/config-monorepo': patch
---

## Update the agent skills

- Updated the Matt Pocock skills (`ask-matt`, `code-review`, `diagnosing-bugs`, `grilling`, `handoff`, `implement`, `setup-matt-pocock-skills`, `tdd`, `teach`, `to-tickets`, `wayfinder`) and the `gitbutler` skill, and updated `skills-lock.json` to match
- Added a required `SKILL.md` read before `ask-matt` describes a skill or recommends skipping it
- Added forced-red test verification and a `/retro` handoff to `diagnosing-bugs`
- Updated `code-review` to run Standards and Spec sub-agents together in the foreground and check for `CODING_STANDARDS.md` and `CONTRIBUTING.md`
- Updated `gitbutler` guidance for `but init`, `-F` message files, and the current `but` version
- Added `.claude/skills` links for the `turborepo` and `wizard` skills, and for the other skills synced from `.agents/skills`
