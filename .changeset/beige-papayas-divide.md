---
'@2digits/oxlint-config': minor
---

Add react-doctor oxlint plugin

- Added `react-doctor` plugin with 150+ rules for React, Next.js, React Native, and TanStack Start
- Switched `reactConfig` plugin resolution from `import.meta.resolve` to `createRequire` for ESM compatibility
- Relaxed `TypedOxlintConfig.extends` type to accept `OxlintConfig` arrays
