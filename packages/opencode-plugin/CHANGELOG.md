# @2digits/opencode-plugin

## 0.1.2

### Patch Changes

- d643f5d: Update @opencode-ai/plugin to 1.2.10

## 0.1.1

### Patch Changes

- a33b04c: Update @opencode-ai/plugin to 1.2.6
  - Updated `@opencode-ai/plugin` from `1.2.5` to `1.2.6`

- f7712d5: Update @opencode-ai/plugin to 1.2.5

## 0.1.0

### Minor Changes

- 590eea0: Update @opencode-ai/plugin to 1.2.4

### Patch Changes

- 834baf1: Update @opencode-ai/plugin to 1.1.60

## 0.0.12

### Patch Changes

- 13454b5: Update @opencode-ai/plugin to 1.1.54

## 0.0.11

### Patch Changes

- 0877a3c: Update @opencode-ai/plugin to 1.1.53

## 0.0.10

### Patch Changes

- 887ec1f: Update @opencode-ai/plugin to 1.1.49

## 0.0.9

### Patch Changes

- efadf20: Update @opencode-ai/plugin to 1.1.39
- 7fa2e59: Update @opencode-ai/plugin to 1.1.42
- 8be246e: Update @opencode-ai/plugin to 1.1.48

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
