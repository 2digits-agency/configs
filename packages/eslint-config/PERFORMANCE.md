# ESLint performance experiments

Measured in a Linux x64 orb with Node 24.20.0, ESLint 10.9.1, Vite+ 0.3.0 and Turbo 2.10.12. Results are synthetic
and machine-dependent; they are not promises about a consumer's full TypeScript project.

## Selected changes

- Load the React, CSS and dependency config modules only when enabled. Most other optional plugins were already
  dynamically imported; moving their lightweight config wrappers would not eliminate their plugin costs.
- Avoid importing React merely to obtain Markdown type-rule disables when no React plugin is configured. Include
  user-supplied React plugins in that decision. Retain TypeScript's Markdown parser and disables.
- Skip filesystem package detection when an integration has an explicit boolean or `enable` setting. Keep
  auto-detection for omitted settings.
- Honor `ts.tsconfigRootDir`, which was documented but previously ignored by the TypeScript config.
- Index the custom array-callback rule's scope references once per scope and rule instance. Stop the handler
  rule's reference scan as soon as a second read is found.

No enabled rule was removed or downgraded. The non-React factory snapshots lose only five already-disabled React
rules. The existing autofix fixtures remain unchanged.

## Fresh-process comparison

`benchmarks/startup.ts` alternates baseline and candidate built entry points. One warmup, then five fresh-process
samples per entry/scenario; median elapsed time, with warm filesystem caches. The baseline was built before the
config changes. Both config builds resolve the same installed dependencies and custom plugin, isolating config
startup rather than attributing custom-rule savings to this table.

| Scenario                               |   Before |    After | Reduction |
| -------------------------------------- | -------: | -------: | --------: |
| JS-only config construction            | 1,857 ms | 1,631 ms |     12.2% |
| TypeScript config construction         | 1,891 ms | 1,778 ms |      5.9% |
| React + TypeScript config construction | 2,057 ms | 1,902 ms |      7.5% |
| Startup + lint 500 JS exports          | 2,120 ms | 1,891 ms |     10.8% |

The lint scenario asserts zero diagnostics. Config counts remain 35, 40 and 42 respectively. Config construction
does not build a consumer TypeScript program, so the TS/React rows are **not** measurements of type-aware linting.
Median RSS improved in the JS lint case (429 → 404 MiB), but not consistently: TS config RSS rose from 395 to
410 MiB and React from 428 to 439 MiB. Do not interpret lazy imports as a guaranteed memory reduction.

## `pack` experiments

The exploratory matrix compared minification, unbundled output, utility bundling and several plugin bundling
sets. Candidates were rebuilt between experiments; lazy-loading changes were developed during exploration.
Use the alternating comparison above for before/after claims, not cross-candidate exploratory timings.

| Candidate                                                                      | Observation                                                                                           | Decision |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------- |
| External dependencies, minified                                                | Original JS output 39.8 kB; selected lazy build about 40.8 kB across six runtime chunks               | Keep     |
| No minification                                                                | Original output grew to 59.4 kB; no startup win (JS config ~1,734 ms vs ~1,682 ms in the initial run) | Reject   |
| `unbundle: true`                                                               | About 48.3 kB across 41 files; no consistent startup win                                              | Reject   |
| Bundle config utilities (`eslint-flat-config-utils`, `local-pkg`, `pkg-types`) | About 212.7 kB; no useful startup win                                                                 | Reject   |
| Bundle Sonar                                                                   | About 6.08 MB; JS config ~1,834 ms vs ~1,809 ms for its external comparison                           | Reject   |
| Bundle Unicorn                                                                 | Runtime failure: `Cannot find module '../data/patch.json'`                                            | Reject   |
| Bundle Unicorn + Stylistic + Markdown                                          | Runtime failure: `Cannot find module '@eslint-community/eslint-utils'`                                | Reject   |
| Broad plugin bundling                                                          | About 14.75 MB; runtime failure on `../data/patch.json`                                               | Reject   |

Keep the existing production `pack` options: minification, external dependencies and normal code splitting.
Do not inline the optional chunks or bundle dependencies that depend on package-relative assets/resolution.
Declaration generation, type generation hooks, publint and attw remain enabled for production builds; their
build-time work is not ESLint startup work.

Reproduce the runtime experiments from this package:

```sh
vp exec node benchmarks/pack.ts
# Or select candidates:
vp exec node benchmarks/pack.ts external unbundle sonar
```

The experiment runner uses `vite-plus/pack`, omits declaration/metadata generation, measures one warmup + three
samples per scenario, reports broken candidates explicitly, and removes its temporary outputs. It is not a
package-validation command. Run the regular build before publishing.

## Custom plugin hot path

A synthetic `Linter.verify` benchmark with two warmups and seven measured samples used 4,000 `map(Boolean)` calls
in one scope. Median time fell from **312.7 ms to 183.7 ms** (41.3%) with identical diagnostics. The old code scanned
the scope's references for each call; the new code builds one identifier lookup per scope.

A second workload (200 handlers, 50 reads each) did not demonstrate an end-to-end gain: **116.9 ms → 135.7 ms**.
The early exit bounds the rule's scan and avoids allocating filtered reference arrays, but parser/traversal cost
and benchmark noise dominate this workload. No whole-project speedup is claimed for that change.

## Workspace caching validation

A temporary three-package monorepo used the README's transit-task recipe, a separate `eslint.config.ts` and
`tsconfig.json` per package, and 100 TypeScript exports per package. Package B depended on A; C was independent.
Actual ESLint processes ran through `turbo run lint --summarize --cache=local:rw`:

| Run             |  Elapsed | A    | B    | C    |
| --------------- | -------: | ---- | ---- | ---- |
| Cold            | 8,403 ms | MISS | MISS | MISS |
| Unchanged       |    49 ms | HIT  | HIT  | HIT  |
| Add source to A | 3,050 ms | MISS | MISS | HIT  |

Cache states were asserted from Turbo's run summaries. This validates independent workspace caching and
dependency invalidation, not a migration or benchmark of an existing consumer monorepo. Avoid layering ESLint's
file cache over typed lint tasks: dependency type changes must not leave cached file diagnostics stale.
