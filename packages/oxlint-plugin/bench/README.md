# Rule performance benchmark

Run from `packages/oxlint-plugin`, using the repository's pinned Node and dependencies:

```sh
vpr bench freeze
# After each optimisation:
vpr build
vpr test
vpr bench
```

Freeze **before changing the rules**. This copies the built baseline bundle and the tracked TypeScript/JavaScript
sources, and records the RuleTester examples with their filenames, options and globals. Extra checked-out repositories
can be supplied to `vpr bench freeze /absolute/path/to/project`. The corpus and baseline live in the ignored
`.cache/benchmark` directory and cannot accidentally be replaced by another freeze. Keep that directory when rebasing.
To reproduce against the original implementation, freeze on commit `723659e60515c9ee1cf349ad0c0ae05ca2264bbd`
with this benchmark harness copied into that checkout, then retain the frozen directory while applying the changes.

All frozen rules run on every file, with only the original example's rule options overridden. Examples without filenames use
TSX; an empty export makes each example a module (including examples using top-level `using`). The corpus is immutable
and SHA-256 checked before each run. No network or external projects are required by the default corpus.

Each measurement uses the shipped Oxlint CLI, `--threads=1`, one warm-up and seven fresh-process samples. The report
contains medians for total JavaScript plugin runtime, rule callbacks, instrumented wall time, and each rule, plus raw
samples and callback counts. Set `OXLINT_BENCH_RUNS` to change the sample count. Measure on an otherwise idle machine;
the goal is a reduction of at least 50% in total plugin runtime, not a claim about all Rust lint rules or startup time.
The baseline is measured again alongside the candidate to control for machine load.

After timing, both bundles lint separate fresh copies of exactly the same corpus, then run `--fix`. The command fails
unless complete sorted diagnostic objects before and after fixing, and the SHA-256 of every fixed file, agree.
The latest report is `.cache/benchmark/latest.json`. Do not benchmark concurrently with builds or tests.

## Initial baseline

`baseline.json` records all per-rule medians from the first successful baseline run:

- Base: `723659e60515c9ee1cf349ad0c0ae05ca2264bbd`, effect-oxlint 0.5.0, Oxlint 1.92.0, Node 26.13.0.
- Corpus: 428 repository files and 926 unique spec examples; 1,354 files, 80 rules, 826 diagnostics.
- Total plugin runtime: 3,490.055 ms; callbacks: 3,211.598 ms; instrumented wall time: 4,314.001 ms.
- Identical-build control: 3,376.823 ms (3.2% variation), identical diagnostics and fixed output.
- Largest rules: pure-decide 348.949 ms, block-file-name 237.803 ms, padding 220.044 ms,
  total-handlers 195.592 ms.

The suggested private projects were not accessible with this orb's credentials, so they are not included. Results cover
this repository and the actual spec corpus, not unmeasured applications.

## Baseline including newly landed rules

PRs #2961, #2962 and #2963 added rules and changed encoding diagnostics while performance work was in progress. Keep
the original frozen baseline, but use a separate freeze of main `24b694d93b66475661f7c112f1d613d5e7d155a6` for comparisons
including those changes: 88 rules, 445 repository files and 1,058 spec examples (1,503 files, 910 diagnostics).

Copy this harness and the benchmark `setupFiles` hook into a checkout of that revision, then freeze before applying
performance changes. `OXLINT_BENCH_DIR` selects an independent state directory for both freezing and comparison:

```sh
OXLINT_BENCH_DIR=.cache/benchmark-main vpr bench freeze
# Retain that state directory when applying the candidate:
OXLINT_BENCH_DIR=.cache/benchmark-main vpr bench
```

The initial unchanged-build control measured 4,131.248 ms versus 4,326.698 ms (4.7% variation). Its corpus SHA-256 is
`a3671712bea5200d84a50c0c688412c7dbebb7be404ceb71cfceea33e55a7408`.

In the nested baseline worktree, declaration generation hit TS2883 path portability, so only declaration generation,
publint and attw were disabled there; the runtime bundle still uses the same minified build script and unmodified rule
sources. The candidate's ordinary build, publint, attw, types and tests run without those overrides.

## Verified 88-rule result

Two complete seven-sample comparisons of the final runtime changes both exceeded the 50% target:

| Measurement                    |     Baseline |    Candidate | Reduction |
| ------------------------------ | -----------: | -----------: | --------: |
| Total plugin runtime           | 4,029.684 ms | 1,940.014 ms |    51.86% |
| Total plugin runtime, repeat   | 3,933.269 ms | 1,934.777 ms |    50.81% |
| Instrumented wall time, repeat | 4,837.040 ms | 2,789.136 ms |    42.34% |

The previous report retained all 88 per-rule medians and raw samples; `result.json` now records the expanded benchmark
below and preserves these historical totals. Both comparisons produced the same 910 full diagnostic objects before fixing,
the same post-fix diagnostics, and identical fixed-file content. The fixed tree SHA-256 is
`46bff92896d67cc67d7f82fd15d97d984cf2c25c90cccf3bfdbd44cf79e65a61`.

## Verified 91-rule result after text-format rules and autofixes

Main `93dd0554baf18d04604d603ec98fe3252592c209` includes #2965's Csv, Ndjson and format-parser rules and #2966's
four-rule autofixes. Freeze that unoptimised revision in a new state directory, `.cache/benchmark-text-formats`, with
the same harness and test hook. Keep both preceding freezes intact. This corpus has 452 repository files and 1,142
spec examples: 1,594 files, all 91 rules enabled, and 990 diagnostics. Its SHA-256 is
`359695ca9d1ef4c8fd43e07327e56068563056eb978c4165d2a12d1dbada1898`.

```sh
OXLINT_BENCH_DIR=.cache/benchmark-text-formats vpr bench freeze
# After applying the candidate and rebuilding:
OXLINT_BENCH_DIR=.cache/benchmark-text-formats vpr bench
```

The unchanged-build control measured 4,758.899 ms versus 4,842.576 ms (1.8% variation). Both full seven-sample
comparisons exceed 50%, with the three added rules using the same runtime bridge as the preceding rules:

| Measurement                    |     Baseline |    Candidate | Reduction |
| ------------------------------ | -----------: | -----------: | --------: |
| Total plugin runtime           | 4,851.109 ms | 2,288.969 ms |    52.82% |
| Total plugin runtime, repeat   | 4,597.644 ms | 2,232.335 ms |    51.45% |
| Instrumented wall time, repeat | 5,604.983 ms | 3,178.925 ms |    43.28% |

`result.json` retains every rule's medians and callback counts, all seven raw samples per build from the repeat,
bundle hashes, the first comparison and unchanged-build control summaries, and the preceding 88-rule totals.
Both expanded comparisons have identical complete diagnostics before and after fixing and identical fixed-file
contents. All 91 metadata objects also match. The fixed tree SHA-256 is
`2cbaff96d48add32e13f04c502a78fbe194d518d4c18cfd6a0f7b8d9ef56cf38`.
The new main autofixes are part of this baseline rather than being compared against the obsolete fixed output.

These are measured medians on this corpus, not a guarantee of a 50% reduction on every application, rule, or run.
The existing test assertions remain unchanged. Shared optimisations preserve Effect-based rule authoring while reusing each
file's service context and import analysis. Rule-specific changes avoid impossible Domain checks, no-policy padding
traversal, logging ancestor walks for non-loggers, inline-schema analysis for non-compilers, and shared Domain-block
collection outside host files.

The three-process padding CLI integration test has a 15-second deadline instead of the default five seconds. The
original baseline checkpoint already exceeded five seconds in CI, and a one-core contention reproduction also timed
out at five seconds but completed with every assertion intact under the new deadline. This is a bounded allowance
for cold process startup, not the performance measurement; the benchmark and production bundle are unchanged.
