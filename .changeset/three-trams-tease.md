---
'@2digits/tlo-mcp': patch
---

Simplify API response handling and add unit tests

- Changed response parsing to expect raw data instead of `TloResponse` wrapper envelope
- Added `isErrorResponse()` helper to detect API errors from response body
- Fixed `ActivityRaw` schema to properly handle nullable fields with `Schema.NullOr()`
- Added `RecordCount` optional field to `GetProjectsResponse`
- Removed unused `SetTaskStateResponse` and `TloAuthError` from response handling
- Replaced `tsx` dev dependency with `@effect/platform-node` for integration tests
- Added unit tests for `BoardService`, `TimeService`, and error types
- Added integration tests with real API calls
