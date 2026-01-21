---
'@2digits/opencode-plugin': patch
---

Refactor feedback tool and add coding style rules

- Extracted `createFeedbackIssue` tool to separate file with improved arg descriptions using `.meta()`
- Added OpenCode version and project context to feedback issue body
- Added "Method Notation in Object Literals" rule preferring `name() {}` over `name: () => {}`
- Added "Embedded Language Strings" rule for using `dedent` with language-named imports for syntax highlighting
