---
packages:
  'npm:@2digits/tlo-mcp': patch
---

## Declare service shapes as properties

- Rewrote `BoardServiceShape`, `TimeServiceShape` and `TeamLeaderClientShape` members as `readonly` function properties, so their parameters type-check contravariantly
- Fixed `TimeServiceShape.getWeek` to return the `Activity` class type instead of `typeof Activity.Type`
