/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import * as Arr from 'effect/Array';
import * as R from 'effect/Record';

import type { RuleName } from '../src';
import { testRule } from './rule-tester';

const effect = `import * as Effect from 'effect/Effect';`;

const worker = `import * as CF from 'alchemy/Cloudflare';`;

const docker = `import * as Docker from 'alchemy/Docker';`;

const fixes = {
  'prefer-effect-duration': [
    [
      'effectDuration',
      `${effect} Effect.sleep(10)`,
      `import * as Duration from 'effect/Duration';\n${effect} Effect.sleep(Duration.millis(10))`,
    ],
    [
      'effectDuration',
      `${effect} import * as D from 'effect/Duration'; Effect.sleep(10)`,
      `${effect} import * as D from 'effect/Duration'; Effect.sleep(D.millis(10))`,
    ],
    [
      'effectDuration',
      `${effect} const Duration = 1; Effect.sleep(10)`,
      `import * as Duration2 from 'effect/Duration';\n${effect} const Duration = 1; Effect.sleep(Duration2.millis(10))`,
    ],
  ],
  'no-empty-effect-callback': [
    ['emptyCallback', `${effect} Effect.callback(() => {})`, `${effect} Effect.never`],
    ['emptyCallback', `${effect} Effect.callback(async () => {})`, null],
    ['emptyCallback', `${effect} Effect.callback((resume = sideEffect()) => {})`, null],
    ['emptyCallback', `${effect} Effect.callback(() => { /* keep */ })`, null],
    ['emptyCallback', `${effect} function f(Effect) { Effect.callback(() => {}) }`, null],
  ],
  'alchemy-no-v1-worker-properties': [
    ['property', `${worker} CF.Worker('w', { entrypoint })`, `${worker} CF.Worker('w', { main: entrypoint })`],
    ['property', `${worker} CF.Worker('w', { bindings: value })`, `${worker} CF.Worker('w', { env: value })`],
    ['property', `${worker} CF.Worker('w', { entrypoint: 'a', main: 'b' })`, null],
    ['property', `${worker} CF.Worker('w', { entrypoint: 'a', ...other })`, null],
  ],
  'alchemy-no-deprecated-docker-constraints': [
    [
      'constraints',
      `${docker} Docker.Service('s', { constraints })`,
      `${docker} Docker.Service('s', { placement: { constraints } })`,
    ],
    ['constraints', `${docker} Docker.Service('s', { constraints, placement: {} })`, null],
    ['constraints', `${docker} Docker.Service('s', { constraints, ...other })`, null],
  ],
  'no-effect-alchemy-barrel-imports': [
    [
      'barrelImport',
      `import { Array as A, pipe, type Effect } from 'effect'; A.sort(xs)`,
      `import { pipe, type Effect } from 'effect';\nimport * as A from 'effect/Array'; A.sort(xs)`,
    ],
    ['barrelImport', `import { /* keep */ Array } from 'effect'`, null],
  ],
  'prefer-effect-alchemy-namespace-imports': [
    [
      'namespace',
      `import { sort } from 'effect/Array'; sort(xs); const o = { sort }; function f(sort) { sort(xs) }`,
      `import * as Arr from 'effect/Array'; (0, Arr.sort)(xs); const o = { sort: Arr.sort }; function f(sort) { sort(xs) }`,
    ],
    [
      'namespace',
      `import { sort, type NonEmptyArray } from 'effect/Array'; sort(xs)`,
      `import * as Arr from 'effect/Array';\nimport { type NonEmptyArray } from 'effect/Array'; (0, Arr.sort)(xs)`,
    ],
    [
      'alias',
      `import * as Predicate from 'effect/Predicate'; Predicate.isString(x)`,
      `import * as P from 'effect/Predicate'; P.isString(x)`,
    ],
    ['namespace', `import { sort } from 'effect/Array'; function f(Arr) { sort(xs) }`, null],
    ['namespace', `import { sort } from 'effect/Array'; export { sort }`, null],
  ],
} satisfies Partial<Record<RuleName, ReadonlyArray<readonly [string, string, string | null]>>>;

for (const [name, cases] of R.toEntries(fixes)) {
  testRule(name, {
    // An empty file stays valid.
    valid: [''],
    invalid: Arr.map(cases, ([messageId, code, output]) => ({ code, errors: [{ messageId }], output })),
  });
}
