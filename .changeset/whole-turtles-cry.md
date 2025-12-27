---
'@2digits/eslint-config': patch
'@2digits/eslint-plugin': patch
---

Add Vitest benchmarking infrastructure

- Added `bench/` directories with Vitest benchmark tests for performance tracking
- Added benchmark fixtures for TypeScript, React, and Next.js linting scenarios
- Added `bench` and `bench:run` scripts to both packages
- Added GitHub Actions workflow for running and comparing benchmarks on PRs
- Updated `.knip.json` to ignore bench directories and vitest binary
