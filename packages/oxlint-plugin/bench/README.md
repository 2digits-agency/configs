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

All 80 rules run on every file, with only the original example's rule options overridden. Examples without filenames use
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
