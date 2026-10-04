# @2digits/oxlint-config

The default preset enables `2digits/padding-line-between-statements`: statements require a blank line between them,
including variable declarations, control flow, and returns. Consecutive imports may stay grouped; existing import
group spacing is preserved. Run Oxlint with `--fix` to insert missing blank lines.

Override the rule through `lint({ rules: { '2digits/padding-line-between-statements': 'off' } })`, or supply your own
spacing policies in its rule options.

The shared preset keeps `capitalized-comments` enabled for ordinary prose, but preserves case-sensitive
`fallow-ignore` suppression directives, including `fallow-ignore-next-line` and `fallow-ignore-file`.
The exception matches the directive family at the start of a comment; prose mentioning a directive remains checked.

The native autofix regression loads the built default export (`lint()`) without consumer overrides and checks both
directive spellings byte-for-byte after two autofix passes. It also verifies lowercase prose is reported and fixed,
already capitalized prose is unchanged, and similarly named prose is still fixed.

Verified with the package's native **Oxlint 1.86.0** and Node.js 24.21.0. Vite+ 1.0.0 bundles Oxlint 1.85.0 separately;
the regression invokes the package's Oxlint CLI directly and removes Vite+'s `VP_VERSION` loader selection and
`NAPI_RS_NATIVE_LIBRARY_PATH` binary override from its child environment. This verifies comment preservation,
not Fallow's dead-code analysis.

After building the workspace, run the package's tests with `vp run test` from this directory.
