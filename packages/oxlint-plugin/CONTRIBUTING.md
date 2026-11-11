# Rule conventions

These conventions apply to every custom rule, including new Effect module rules. Oxlint's JavaScript API has no type
checker: use syntax and lexical bindings, not assumptions about a value's inferred type. Read the installed Effect
source with [opensrc](https://opensrc.sh/) when an API's behavior matters.

## Names and diagnostics

- Use kebab-case rule names, matching the file name and registry key. Use `no-*` for a forbidden construct,
  `prefer-*` for a preferred alternative, `require-*` for a required part of a construct, `consistent-*` for a
  bidirectional style policy, and `valid-*` for validation. Keep `alchemy-` / `alchemy-domain-` prefixes for those scopes.
- Existing public names are compatibility contracts. Do not rename an existing rule just to fit these prefixes.
  A later rename needs a deprecated alias and migration note, or a breaking release.
- Use `Rule.define`, `ruleMeta`, `RuleContext`, `Visitor` and `Diagnostic.fromId`. Keep per-file mutable state inside
  `create` (use `Ref` when visitors share it). Do not introduce separate syntax/Effect rule factories.
- Descriptions are short sentences ending in a period. Messages explain the problem or name an action and the API to
  use, without repeating the rule name. Keep useful reasons and caveats rather than forcing every message into one template.
- MessageIds are semantic lowerCamelCase (`emptyStruct`, `asyncTry`), not rule names or ordinal numbers. Keep existing
  IDs and interpolation keys stable. Distinct remedies may have distinct IDs. Suggestion IDs describe the action.
- `meta.type` describes the diagnostic: `problem` for correctness/deprecated APIs, `suggestion` for a preferred style
  or design, `layout` for whitespace. It does **not** choose severity or mean that an editor suggestion exists.
- Preserve attribution in `NOTICE` and upstream links in `meta.docs.url`; a link need not be this package's own docs.

## Plain reports, suggestions and fixes

Report by default. A semantic migration (number → Duration, Error → Schema error, native I/O → service, renaming a schema
key, hoisting a function) needs human judgment and is not an autofix merely because replacement text can be produced.

Use `fixable: 'code'` only for a proven safe local rewrite, and `fixable: 'whitespace'` for layout. Preserve comments,
evaluation order, bindings and contextual typing. A diagnostic can remain useful when no safe fix exists: use
`withOptionalFix` rather than skipping the report. Check property collisions and spreads with `plainOptions`, and use
`namespaceImport` for imports and collision-free aliases. Tests must check exact output and a no-fix boundary.

Use `hasSuggestions: true` only for explicit editor actions that need review; never add a suggestion solely to match a
different rule's presentation. `ban-error-string` deliberately offers the `useCause` suggestion. The seven existing code
fixers and the spacing fixer retain their delivery modes. The #2966 follow-up adds the two guarded code fixers and
four suggestion-capable rules described below; do not turn their review-only rewrites into automatic fixes.

## Import recognition and file gates

Get `const imports = yield* importBindings` once in `create`. Match `imports.isApi`, `member`, `isApiPath` or `path`
against canonical API paths, not local spellings (`Fx`, `S`, `Arr`, `P`). The shared collector supports namespace, named,
aliased and string-literal imports, root/lowercase barrels, PascalCase submodules, and static computed properties.
Runtime API matches use lexical references, so a parameter/local shadowing an import and a type-only import cannot be
mistaken for the API. Do not add a second runtime-import check in each rule.

`hasEffectImport` is a different contract: any static `effect` / `effect/*` / `@effect/*` import, including type-only and
side-effect imports, marks an **Effect file**. Native-syntax guidance uses this gate. It does not imply that every
identifier named `Effect` is the imported API. The `bindings` map includes type-only imports for annotation analysis;
resolve the annotation's type scope before using it. Unknown or dynamic member paths are not API matches.

Keep stricter checks when the contract needs the exact import source, not just the module name:
`no-uppercase-http-api-header` intentionally accepts only Effect v4 HTTP API entrypoints, not v3 `@effect/platform`.
`consistent-schema-pipe` intentionally rewrites two-part namespace expressions, not named imports (ADR 0001).

Preserved syntax-policy exceptions:

- The three `no-manual-*-tag*` rules do not require Effect imports. Catch/pattern exemptions recognize literal
  `Effect` / `Match` names, not aliases or lexical shadowing; this is inherited behavior, not an import-helper pattern.
- `prefer-effect-match` checks literal ternary chains everywhere, but switches / else-if chains only in Effect files.
- `no-utc-iso-slicing` checks native ISO slicing everywhere, and imported Effect formatting through `ImportBindings`.
- Import policies, error coercion, literal tagged construction and React directives are syntactic checks, not Effect-file rules.

Use the existing `internal/ast`, `internal/scope`, `internal/fixes`, `effect/internal/callbacks` and
`effect/internal/duration` helpers before adding a local equivalent. Keep source-specific or domain-specific logic local
when a general helper would broaden its meaning. For example, `promiseThunkArgument` is shared by `try` and Promise
rules; function-declaration traversal is deliberately not implied by the expression-only `isFunctionNode` guard.

## Options and recommended configuration

`ruleMeta` defaults to `schema: []` (no options) and `docs.recommended: true`. Both `recommendedRules` and
`plugin.configs.recommended` derive their membership from this flag, at **error** severity by default. The explicit
`warnRules` exception in `src/index.ts` keeps `prefer-effect-http-status` at **warn** in both recommended exports:
it names well-known values rather than catching defects. A new rule is recommended unless explicitly opted out;
review membership and severity separately before registering it. `configs.all` includes every rule at error,
including opt-in rules and the status warning.

The public `recommendedRules` uses the `2digits/` registration alias; generated `configs` retain the package-name
namespace and register the package themselves. These are two supported registration styles, not two severity policies.

Opt-in rules: `prefer-effect-filesystem` and `prefer-effect-path` overlap the configured tsgo Node import diagnostic;
`padding-line-between-statements` needs a project-specific spacing policy. With no spacing options it reports nothing.

For a configurable rule, declare both Oxlint's JSON `meta.schema` and the Effect `options` decoder. Keep constraints
(integer bounds, nonempty strings, uniqueness), optional keys and defaults aligned. Disallow unknown properties in the
JSON object schema. Put externally visible defaults in `meta.defaultOptions`, using the same constant as runtime fallback.
`no-manual-tag-comparison` accepts `{ discriminants }` (default `['kind', 'status']`; `_tag` is always checked);
`no-single-use-private-function` accepts `{ maxLines }` (integer ≥ 1, default 3).

Spacing is the deliberate variadic exception: it validates the complete policy array with `$defs` and `parseOptions`,
because effect-oxlint 0.5 decodes only `options[0]`. Do not force it into a single-object decoder.

## Tests and documentation

Use `testRule` for a compact valid/invalid pair, or `createRuleTester().run` for a matrix. Both come from
`test/rule-tester.ts`, which owns the `@effect/vitest` hooks and TypeScript module defaults. Override language options for
JSX; do not rely on another test file to initialize global RuleTester hooks. Preserve multiline and filename-sensitive
cases when they express the rule's contract.

Test observable diagnostics (`messageId`, relevant `data` and useful locations), exact fixes/suggestions, and valid
controls. For imported APIs include canonical and aliased namespaces, a named import where supported, shadowing,
type-only imports and an unrelated same-named API. For file-gated rules include a file without Effect. Test default and
custom options for configurable rules. Add native runtime controls when a diagnostic depends on subtle API semantics;
use `it.effect` for Effect execution and regular `it` for RuleTester/CLI harnesses.

Register the rule in `src/rules/index.ts`, add its corresponding `test/rules/<group>/<name>.spec.ts`, describe its scope,
replacement and fix safety in the README, and add a Tegami entry for user-visible changes. Run `vpr test`, `vpr types`,
`vpr build` here, then `vpr check` at the repository root. CLI tests use the built plugin, so rebuild before final validation.

## Compatibility names to consider later

No rule is renamed by this consistency pass. Possible names for a future alias-backed migration:

| Existing name                                | Proposed name                                   |
| -------------------------------------------- | ----------------------------------------------- |
| `avoid-data-tagged-error`                    | `prefer-schema-tagged-error`                    |
| `ban-error-string`                           | `no-error-string-coercion`                      |
| `effect-promise-vs-trypromise`               | `prefer-effect-try-promise`                     |
| `throw-in-effect-gen`                        | `no-throw-in-effect-gen`                        |
| `cors-credentials-with-wildcard`             | `no-cors-credentials-with-wildcard`             |
| `dual-numeric-arity-with-optional-parameter` | `no-dual-numeric-arity-with-optional-parameter` |

## Audited rule inventory

All 80 rules present after #2959 were reviewed. This is the baseline inventory, not an additional registry to maintain
for future rules. **API** means shared runtime-import matching; **File** means Effect-file syntax guidance (some checks
also match imported APIs); **Syntax** needs no Effect import. All are recommended at error except the three opt-ins
noted above. No options unless named in the options section. **Report** means no automatic or editor fix. Delivery
includes the #2966 follow-up modes, whose safety boundaries are described below.

| Rule                                           | Scope                             | Delivery          |
| ---------------------------------------------- | --------------------------------- | ----------------- |
| `alchemy-domain-block-file-name`               | API + filename                    | Report            |
| `alchemy-domain-pure-decide`                   | API + decide handler              | Report            |
| `alchemy-domain-pure-imports`                  | Domain import + block filename    | Report            |
| `alchemy-domain-require-view-version`          | API                               | Report            |
| `alchemy-domain-total-handlers`                | API + handler                     | Report            |
| `alchemy-no-cloudflare-init-finalizer`         | API                               | Report            |
| `alchemy-no-deprecated-docker-constraints`     | API                               | Code fix          |
| `alchemy-no-deprecated-resource`               | API                               | Report            |
| `alchemy-no-plaintext-github-secret`           | API                               | Report            |
| `alchemy-no-removed-config-api`                | API                               | Report            |
| `alchemy-no-reserved-eventbridge-default-name` | API                               | Report            |
| `alchemy-no-runtime-config`                    | API                               | Report            |
| `alchemy-no-v1-import`                         | Import source                     | Report            |
| `alchemy-no-v1-worker-properties`              | API                               | Code fix          |
| `avoid-data-tagged-error`                      | API                               | Report            |
| `ban-error-string`                             | Syntax                            | Editor suggestion |
| `consistent-schema-pipe`                       | File + namespace API              | Code fix          |
| `cors-credentials-with-wildcard`               | API                               | Report            |
| `dual-numeric-arity-with-optional-parameter`   | API                               | Report            |
| `effect-promise-vs-trypromise`                 | API                               | Report            |
| `no-already-started-promise`                   | API                               | Report            |
| `no-async-effect-try`                          | API                               | Report            |
| `no-browser-api-in-render`                     | React component/hook              | Report            |
| `no-constant-thunk`                            | Syntax + API purity checks        | Report            |
| `no-discarded-run-promise`                     | API                               | Report            |
| `no-discarded-schema-checks`                   | File                              | Report            |
| `no-effect-alchemy-barrel-imports`             | Import source                     | Code fix          |
| `no-effect-as-on-log`                          | API                               | Report            |
| `no-empty-effect-callback`                     | API                               | Code fix          |
| `no-empty-schema-struct`                       | API                               | Report            |
| `no-export-all-in-client`                      | React directive                   | Report            |
| `no-forwarding-lambda`                         | API callback                      | Fix / suggestion  |
| `no-function-config-default`                   | API                               | Report            |
| `no-hash-as-identity`                          | API                               | Report            |
| `no-inline-schema-compile`                     | File + API                        | Report            |
| `no-logging-in-catch`                          | API                               | Report            |
| `no-manual-effect-error-tag`                   | Syntax                            | Report            |
| `no-manual-tag-comparison`                     | Syntax                            | Editor suggestion |
| `no-manual-tagged-construction`                | Syntax                            | Report            |
| `no-millis-arithmetic`                         | File                              | Report            |
| `no-multi-shot-effect-callback`                | API                               | Report            |
| `no-non-json-schema-annotation`                | File                              | Report            |
| `no-option-of-service`                         | API                               | Report            |
| `no-overwritten-discriminant`                  | Syntax                            | Report            |
| `no-service-constructor-imports`               | Relative import + filename        | Report            |
| `no-service-option-get-or-throw`               | API                               | Report            |
| `no-single-use-private-function`               | Syntax + API initializers         | Report            |
| `no-throw-in-effect-callback`                  | API callback                      | Report            |
| `no-trivial-wrapper`                           | Syntax + API partial applications | Report            |
| `no-uppercase-http-api-header`                 | Exact v4 import source            | Report            |
| `no-utc-iso-slicing`                           | Syntax + API                      | Report            |
| `no-zero-retry-times`                          | API                               | Report            |
| `padding-line-between-statements`              | Syntax, opt-in                    | Whitespace fix    |
| `prefer-data-match`                            | API                               | Report            |
| `prefer-effect-alchemy-namespace-imports`      | Import source                     | Code fix          |
| `prefer-effect-array-ops`                      | File                              | Report            |
| `prefer-effect-array-sort`                     | File                              | Report            |
| `prefer-effect-datetime`                       | File                              | Report            |
| `prefer-effect-duration`                       | API                               | Code fix          |
| `prefer-effect-duration-constants`             | File + API arguments              | Report            |
| `prefer-effect-duration-types`                 | File                              | Report            |
| `prefer-effect-encoding`                       | File                              | Report            |
| `prefer-effect-filesystem`                     | File, opt-in                      | Report            |
| `prefer-effect-filter`                         | API                               | Report            |
| `prefer-effect-headers`                        | File                              | Report            |
| `prefer-effect-match`                          | Syntax + File                     | Report            |
| `prefer-effect-path`                           | File, opt-in                      | Report            |
| `prefer-effect-predicate`                      | File                              | Fix / suggestion  |
| `prefer-effect-url`                            | File                              | Report            |
| `prefer-equal`                                 | File                              | Report            |
| `prefer-hoisted-match`                         | API                               | Report            |
| `prefer-struct-assign`                         | File                              | Editor suggestion |
| `prefer-uninterruptible`                       | API                               | Report            |
| `prefer-with-span`                             | API                               | Report            |
| `prefer-yield-now`                             | API                               | Report            |
| `preserve-caught-error`                        | API                               | Report            |
| `require-schema-class-brand`                   | API                               | Report            |
| `require-try-promise-abort-signal`             | API callback                      | Report            |
| `throw-in-effect-gen`                          | API generator                     | Report            |
| `valid-directive`                              | React directive                   | Report            |

### Follow-up audit: #2961

The three rules merged after the baseline also follow these conventions. Their tests use the shared RuleTester setup;
all three use `ruleMeta`, have no options, report without fixes or suggestions, and are recommended at error severity.
Their behavior is unchanged. `onRuntimeImport` deliberately checks package sources, not imported API references: it
skips type-only third-party imports but includes side-effect and literal dynamic imports. `fflate` is checked only for
named Zip exports, preserving its unrelated compression APIs and the documented disk-extraction exclusions.

| Rule                    | Scope                           | Delivery |
| ----------------------- | ------------------------------- | -------- |
| `no-manual-sse`         | File + native/API string checks | Report   |
| `prefer-effect-sse`     | File + package/global checks    | Report   |
| `prefer-effect-archive` | File + package/export checks    | Report   |

### Follow-up audits: #2962 and #2963

The Jwt, NetAddress and UserDirectories rules, and the binary encoding rules, use the same shared test setup. Their
metadata, no-options schemas, report-only delivery and error-level recommendation already match the conventions.
`moduleImportMember` resolves non-Effect APIs such as `node:os` and `node:net` through lexical imports; keep this
source-specific check alongside the Effect/Alchemy collector rather than treating Node modules as Effect modules.

The existing JWT/IP/directory library checks still inspect exact static import sources, including type-only imports;
they do not gain dynamic-import or package-subpath matching in this audit. This preserves their import-policy contract
rather than silently adopting the different runtime-package policy of the SSE/archive rules. Native string/Buffer
heuristics and the binary rules' literal `pipe` fallback also remain unchanged.

| Rule                             | Scope                           | Delivery |
| -------------------------------- | ------------------------------- | -------- |
| `prefer-effect-jwt`              | File + import/string checks     | Report   |
| `prefer-effect-net-address`      | File + Node API/IP syntax       | Report   |
| `prefer-effect-user-directories` | File + API/environment checks   | Report   |
| `prefer-effect-encoding`         | File + native encoding checks   | Report   |
| `no-manual-encoding`             | File + native/API string checks | Report   |
| `no-encoding-get-or-throw`       | API                             | Report   |

### Follow-up audit: #2965

The three structured-text rules use the shared RuleTester setup. Their `prefer-*` names, semantic messageIds,
`ruleMeta` defaults, no-options schemas, report-only delivery and error-level recommendation already match the
conventions. All three require an Effect file. `internal/lines` shares the CSV/NDJSON collection tracing; keep this
domain-specific analysis local rather than broadening the general AST helpers.

The native split/join and literal `.pipe` heuristics remain unchanged. Effect String/Array/Function APIs use the shared
lexical import collector, and JSON methods use the global binding check. The format-parser rule deliberately checks
exact static runtime package imports, with member-use checks for default/namespace imports whose serializers remain
allowed. It skips type-only imports and does not gain side-effect or dynamic-import reports in this audit.

| Rule                          | Scope                               | Delivery |
| ----------------------------- | ----------------------------------- | -------- |
| `prefer-effect-csv`           | File + native/API collection checks | Report   |
| `prefer-effect-ndjson`        | File + native/API collection checks | Report   |
| `prefer-effect-format-parser` | File + package/export checks        | Report   |

### Follow-up audit: #2966

The four newly expanded rules already follow the fix/suggestion conventions. Keep their new messageIds and delivery
modes from main, along with the exact-output and no-fix/no-suggestion tests. The shared test helper retains its
suggestion assertions; the forwarding-lambda matrix uses the shared hooks while keeping its no-fix lint exemption.
All four remain recommended at error severity, with no new options.

- `prefer-effect-predicate` fixes equivalent checks, but suggests checks with different runtime or narrowing behavior.
  Boxed primitive checks and rewrites that would drop comments remain report-only.
- `no-forwarding-lambda` fixes settled local callees with one signature and suggests other settled callees. It keeps
  the evaluation-time, reassignment, overload, annotation and comment guards.
- `no-manual-tag-comparison` suggests `Predicate.isTagged` only for string `_tag` comparisons without comments;
  nullable values can behave differently, so this must not become an automatic fix.
- `prefer-struct-assign` suggests two-object merges/copies without comments. Contextual typing, literal widening and
  multi-spread boundaries remain unchanged.

The namespace-import, argument-parenthesizing and replacement helpers in `internal/fixes` are shared by these rules.
Do not duplicate them or reduce a suggestion to a fix merely because the generated text looks simpler.

### Follow-up audit: #2964

All five HTTP rules already use `ruleMeta`, semantic messageIds, no-options schemas and the shared `testRule` setup.
They stay report-only: replacing HTTP strings, method lists or response checks needs human judgment. Both recommended
exports preserve the status rule's warning severity and the other four rules' error severity. The configuration test
checks this exception explicitly; it does not promote the warning just to match the baseline inventory.

All five require an Effect file, including one with only a static type or side-effect import. The status API checks and
Cookies parser exemptions use shared lexical imports, including aliases and named imports. Native response/cookie/query
checks are syntax heuristics, not inferred HTTP types. The `httpApiStatus` annotation-key check is also syntactic;
do not require a particular Schema constructor or broaden it to plain `status` keys. The HTTP method rule counts six
distinct recognized methods, not six entries, and leaves deliberate shorter subsets alone.

`prefer-effect-url-params` keeps its test-file exemption and permits `URLSearchParams(text)` parsing and tagged
templates. Reuse `internal/files.isTestFilename`, which is also used by `no-service-constructor-imports`, rather than
adding another test-file regex. Cookie fixtures, raw header passthroughs and the existing name/attribute heuristics
remain unchanged. The CLI integration test keeps main's single 30-second timeout, not an additional global timeout.

| Rule                         | Scope                                 | Delivery | Recommended |
| ---------------------------- | ------------------------------------- | -------- | ----------- |
| `prefer-effect-match-status` | File + native response checks         | Report   | error       |
| `prefer-effect-url-params`   | File + query/global checks, not tests | Report   | error       |
| `prefer-effect-http-method`  | File + literal method lists/unions    | Report   | error       |
| `prefer-effect-http-status`  | File + API + annotation-key syntax    | Report   | warn        |
| `prefer-effect-cookies`      | File + native checks/API exemptions   | Report   | error       |
