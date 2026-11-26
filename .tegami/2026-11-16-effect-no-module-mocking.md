---
packages:
  '@2digits/oxlint-config': minor
---

### Report module mocks in Effect projects

When `effect` is installed, the Vitest config reports `vi.mock` and `vi.doMock` through `vitest/no-restricted-vi-methods`. Replace the dependency through a layer or another real interface instead. The new `vitest.moduleMocks` option overrides the detection: `true` allows module mocks, `false` reports them in any project.
