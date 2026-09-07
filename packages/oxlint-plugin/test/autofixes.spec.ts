/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null, sonar/no-duplicate-string -- Keep RuleTester no-fix assertions and table cases explicit. */
import { rules } from '../src';
import { testRule } from './rule-tester';

const effect = `import * as Effect from 'effect/Effect';`;
const worker = `import * as CF from 'alchemy/Cloudflare';`;
const docker = `import * as Docker from 'alchemy/Docker';`;

for (const [name, messageId, invalid, output] of [
  [
    'prefer-effect-duration',
    'effectDuration',
    `${effect} Effect.sleep(10)`,
    `import * as Duration from 'effect/Duration';\n${effect} Effect.sleep(Duration.millis(10))`,
  ],
  [
    'prefer-effect-duration',
    'effectDuration',
    `${effect} import * as D from 'effect/Duration'; Effect.sleep(10)`,
    `${effect} import * as D from 'effect/Duration'; Effect.sleep(D.millis(10))`,
  ],
  [
    'prefer-effect-duration',
    'effectDuration',
    `${effect} const Duration = 1; Effect.sleep(10)`,
    `import * as Duration2 from 'effect/Duration';\n${effect} const Duration = 1; Effect.sleep(Duration2.millis(10))`,
  ],
  ['prefer-effect-duration', 'effectDuration', `${effect} function f(Effect) { Effect.sleep(10) }`, null],
  ['no-empty-effect-callback', 'emptyCallback', `${effect} Effect.callback(() => {})`, `${effect} Effect.never`],
  ['no-empty-effect-callback', 'emptyCallback', `${effect} Effect.callback(async () => {})`, null],
  ['no-empty-effect-callback', 'emptyCallback', `${effect} Effect.callback((resume = sideEffect()) => {})`, null],
  ['no-empty-effect-callback', 'emptyCallback', `${effect} Effect.callback(() => { /* keep */ })`, null],
  ['no-empty-effect-callback', 'emptyCallback', `${effect} function f(Effect) { Effect.callback(() => {}) }`, null],
  [
    'alchemy-no-v1-worker-properties',
    'property',
    `${worker} CF.Worker('w', { entrypoint })`,
    `${worker} CF.Worker('w', { main: entrypoint })`,
  ],
  [
    'alchemy-no-v1-worker-properties',
    'property',
    `${worker} CF.Worker('w', { bindings: value })`,
    `${worker} CF.Worker('w', { env: value })`,
  ],
  ['alchemy-no-v1-worker-properties', 'property', `${worker} CF.Worker('w', { entrypoint: 'a', main: 'b' })`, null],
  ['alchemy-no-v1-worker-properties', 'property', `${worker} CF.Worker('w', { entrypoint: 'a', ...other })`, null],
  [
    'alchemy-no-deprecated-docker-constraints',
    'constraints',
    `${docker} Docker.Service('s', { constraints })`,
    `${docker} Docker.Service('s', { placement: { constraints } })`,
  ],
  [
    'alchemy-no-deprecated-docker-constraints',
    'constraints',
    `${docker} Docker.Service('s', { constraints, placement: {} })`,
    null,
  ],
  [
    'alchemy-no-deprecated-docker-constraints',
    'constraints',
    `${docker} Docker.Service('s', { constraints, ...other })`,
    null,
  ],
  [
    'no-effect-alchemy-barrel-imports',
    'barrelImport',
    `import { Array as A, pipe, type Effect } from 'effect'; A.sort(xs)`,
    `import { pipe, type Effect } from 'effect';\nimport * as A from 'effect/Array'; A.sort(xs)`,
  ],
  ['no-effect-alchemy-barrel-imports', 'barrelImport', `import { /* keep */ Array } from 'effect'`, null],
  [
    'prefer-effect-alchemy-namespace-imports',
    'namespace',
    `import { sort } from 'effect/Array'; sort(xs); const o = { sort }; function f(sort) { sort(xs) }`,
    `import * as Arr from 'effect/Array'; (0, Arr.sort)(xs); const o = { sort: Arr.sort }; function f(sort) { sort(xs) }`,
  ],
  [
    'prefer-effect-alchemy-namespace-imports',
    'namespace',
    `import { sort, type NonEmptyArray } from 'effect/Array'; sort(xs)`,
    `import * as Arr from 'effect/Array';\nimport { type NonEmptyArray } from 'effect/Array'; (0, Arr.sort)(xs)`,
  ],
  [
    'prefer-effect-alchemy-namespace-imports',
    'alias',
    `import * as Predicate from 'effect/Predicate'; Predicate.isString(x)`,
    `import * as P from 'effect/Predicate'; P.isString(x)`,
  ],
  [
    'prefer-effect-alchemy-namespace-imports',
    'namespace',
    `import { sort } from 'effect/Array'; function f(Arr) { sort(xs) }`,
    null,
  ],
  [
    'prefer-effect-alchemy-namespace-imports',
    'namespace',
    `import { sort } from 'effect/Array'; export { sort }`,
    null,
  ],
] as const) {
  testRule(name, rules[name], { valid: '', messageId, invalid, output });
}
