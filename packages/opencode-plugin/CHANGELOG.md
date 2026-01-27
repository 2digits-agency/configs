# @2digits/opencode-plugin

## 0.0.8

### Patch Changes

- 71c96f8: Update @opencode-ai/plugin to 1.1.36

## 0.0.7

### Patch Changes

- 6aec756: Update @opencode-ai/plugin to 1.1.35

## 0.0.6

### Patch Changes

- 7b6ba6d: Refactor feedback tool and add coding style rules
  - Extracted `createFeedbackIssue` tool to separate file with improved arg descriptions using `.meta()`
  - Added OpenCode version and project context to feedback issue body
  - Added "Method Notation in Object Literals" rule preferring `name() {}` over `name: () => {}`
  - Added "Embedded Language Strings" rule for using `dedent` with language-named imports for syntax highlighting

## 0.0.5

### Patch Changes

- 91ee064: Update @opencode-ai/plugin to 1.1.28

## 0.0.4

### Patch Changes

- ba8d11a: Update @opencode-ai/plugin to 1.1.27

## 0.0.3

### Patch Changes

- 7625383: Update @typescript/native-preview to 7.0.0-dev.20260120.1

## 0.0.2

### Patch Changes

- 730b63f: Update @opencode-ai/plugin to 1.1.26

## 0.0.1

### Patch Changes

- dc1f039: Add OpenCode plugin for shared team rules and feedback system
  - Created new package providing OpenCode plugin hooks for 2digits team
  - Added `/fix` command to submit feedback about agent behavior via GitHub issues
  - Included shared rules for code quality, React, and Effect patterns via markdown files
  - Integrated `create_feedback_issue` tool to create labeled GitHub issues in 2digits-agency/configs
