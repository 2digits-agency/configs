# TLO Workspace · GPUIX

A separate desktop-first TLO variant built with **actual GPUIX 0.10.0**: React commits a retained tree to the Rust/GPUI renderer. The browser preview uses the published GPUIX WebAssembly renderer, not React DOM or an HTML reimplementation. The same `App` runs in native and browser entrypoints.

Application logic uses the workspace's **Effect v4 (4.0.4)**: reusable `Effect.fn` validation/concept flows, `Schema` at input boundaries, `DateTime` calendar arithmetic, typed errors, abortable MCP reads and scoped connection cleanup. GPUIX/React owns rendering and UI state; Bun owns build/server bootstrapping.

**All workspace data is fictional DEMO data. No live writes exist in this package.** Demo bookings and internal notes live only in session memory; refresh resets them. Corrections, deletion requests and customer replies are unsent concepts, not approval requests. The gateway does not enforce Executor approval policy, so it cannot safely substitute for that chain.

## Build and start

From the repository root, with Vite+ and Bun available (verified with Bun 1.3.10):

```sh
vp install
vp run --filter @2digits/tlo-gpuix preview
# Browser demo server: port 4175, optionally PORT=…

vp run --filter @2digits/tlo-gpuix web:build
# web-dist/app.js + published GPUIX .wasm assets

vp run --filter @2digits/tlo-gpuix start
vp run --filter @2digits/tlo-gpuix build
# Native executable: packages/tlo-gpuix/dist/tlo-gpuix
```

The preview server rebuilds on startup, not on file changes. Restart after edits. Serve the top-level document with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`; JS and WASM must remain on the same origin. `web.ts` supplies these headers. Shared memory requires a secure context (HTTPS, or loopback for development). Expect a roughly 20 MB WASM download and a short first-load delay. Recommended desktop viewport: 1440 × 900; this is not a mobile application.

In an Amp orb, expose the demo through a supervised portal:

```sh
amp orb service start tlo-gpuix \
  --command 'vp run --filter @2digits/tlo-gpuix preview' --port 4175 --portal
```

Published packages include native binaries and WASM; **building this application does not require Rust, Xcode or wasm-bindgen**. Building GPUIX itself is different: upstream documents a Rust toolchain, its pinned GPUI fork and platform development libraries; rebuilding browser WASM additionally needs nightly Rust, `rust-src`, the WASM target and matching wasm-bindgen CLI. These are not installed by this package.

## Platform evidence and limits

- Browser: exercised in Chromium on Debian 12, using GPUI's **WebGL2 fallback via SwiftShader** because the orb has no usable WebGPU adapter. Actual Rust/WASM rendering, inputs, pointer interaction and scrolling work.
- Native: Bun compilation succeeds, but **execution fails in this orb**: the published Linux addon requires `GLIBC_2.38`; Debian 12 provides 2.36. Compiling a Bun executable does not remove that ABI requirement. Use a compatible graphical Linux host, or rebuild the native addon on the target platform. Do not upgrade the orb's libc in place.
- macOS/Windows: documented upstream targets, **not tested here**. No platform package/signing/distribution claim is made.
- Native headless GPUIX testing is not supported on Linux according to upstream docs. Domain/MCP tests and the real browser renderer are used instead. Native focus/background options are not honored on Linux.
- Canvas elements have GPUIX roles/labels, not DOM buttons. Use `globalThis.gpuix.getByTestId(...)` for renderer automation. Browser screen-reader parity is not proven.

## Optional native read-only inspector

On a compatible native host, start the **existing** `packages/tlo-mcp` daemon first using its own documented setup, then:

```sh
# Inside packages/tlo-gpuix:
vp exec bun src/native.tsx --live
```

The native-only gateway module reads the existing owner's private, regular key file at `~/.config/2digits/tlo-mcp/gateway.key` (no group/other permissions) and calls only `http://127.0.0.1:4790/mcp`. There is no OAuth provider, refresh process, credential form or browser-to-gateway connection. The browser entrypoint does not import the gateway, SDK or key-file code.

Each explicit read owns a scoped MCP connection. The client checks a fixed exact-name read allowlist, paginated live discovery, `readOnlyHint: true` and the current input schema; extra arguments and `DEMO-` IDs fail closed. It does not silently retry. Abort signals reach SDK requests and the connection closes with its Effect scope. Responses stay **raw MCP envelopes** in an inspector; unproven business output adapters are not presented as normalized live timesheets. Real Orbit reads were not executed in this orb.

## Workflow and safety contracts

- Week/day totals keep written hours, planning and absence separate. Search distinguishes project tasks, ticket numbers and API IDs. An empty limited search does not prove a task does not exist.
- Booking requires a confirmed open demo task, existing civil date, explicit `HH:mm` start, whole minutes, description and explicit billing choice. No 09:00 default. Overlaps and cross-midnight entries are rejected; exact midnight is allowed.
- Orbit time zone is unproven. `Europe/Amsterdam` is only a preference: payloads preserve wall time without converting DST or inventing offsets. Effect `DateTime` performs calendar arithmetic only.
- Time-entry `dateTo` is inclusive; ticket `createdTo` is exclusive. Creation billing is a boolean; correction billing is a string. FINAL/invoiced/absence records cannot be corrected or deleted.
- Demo readback compares task, date/start, duration, billable and description. Verified, Mismatch and Unknown are distinct; mismatch stops, unknown offers readback of the existing demo entry, never an automatic write retry.
- Internal notes contain no `logMinutes`: book hours separately. Customer reply is a separate concept with a notification/WAIT/reopen warning, `followUpAction: NONE` and `waitForClient: true`; it is never sent.
- Corrections/deletions/customer communication require the eventual external approval chain. Concepts do not mutate original records. Historical HAR board writes, `EXT_*`, timers, planning writes and unlocking remain excluded.

## Verification

```sh
# Inside packages/tlo-gpuix:
vp run types
vp test
vp run web:build
vp run build

# From root:
vp check
vp test
```

Domain tests cover asymmetric readback mismatches, overlap boundaries, invalid external drafts, DST/leap/year date boundaries and boolean/string billing. MCP tests use an actual linked in-memory SDK server with writes advertised and verify that this client cannot execute them, trusts only current read-only annotations and rejects invalid inputs. These tests do not prove a live Orbit output contract or Executor approvals.

Orb result: **33 tests pass**, package type-check, both builds, scoped Knip and workspace package validation pass. `vp check packages/tlo-gpuix` reports zero errors and three nonblocking index-key warnings for display-only/append-only lists. Repository-wide `vp check`/`vp test` are not green: existing config packages have missing build output; attempts to build them fail because the bundled declaration builder rejects their TypeScript 7 setup. No unrelated toolchain migration was made. Browser flows were exercised and screenshots inspected at 1440 and 1280 desktop widths; a pointer-interaction recording is sped up 8× because software rendering under capture is slow.

Framework/build research: [GPUIX docs](https://gpuix.dev/docs), [full documentation](https://gpuix.dev/llms-full.txt), [GPUIX source](https://github.com/remorses/gpuix). Domain context: [TLO research](https://ampcode.com/threads/T-01a134dc-2aa9-70e6-913c-995aedd176fe) and [proposal](https://ampcode.com/threads/T-01a134eb-846c-76eb-8356-4e227527e71b). Foldkit/OpenTUI are independent variants, not dependencies of this package.
