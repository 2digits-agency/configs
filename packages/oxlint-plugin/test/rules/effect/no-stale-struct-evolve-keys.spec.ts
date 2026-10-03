/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- Explicit syntax controls and no-fix assertions. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noStaleStructEvolveKeys } from '../../../src/rules/effect/no-stale-struct-evolve-keys';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});
const struct = `import * as Struct from 'effect/Struct';`;
const target = `{ name: 'alice', zip: '00000' }`;
const updater = `{ name: s => s.toUpperCase(), zipCode: s => '12345' }`;

tester.run('no-stale-struct-evolve-keys', noStaleStructEvolveKeys, {
  valid: [
    `${struct} Struct.evolve(${target}, { name: s => s.toUpperCase() })`,
    `${struct} Struct.evolve({ 1: 'a', '2': 'b' }, { '1': s => s, 2: s => s })`,
    `${struct} Struct.evolve(${target}, {})`,
    `${struct} Struct.evolve({ name: 'alice' }, { name: s => s })`,
    `${struct} Struct.evolve(${target}, { name(s) { return s } })`,
    `${struct} Struct.evolve(${target})`,
    `${struct} Struct.evolve(${target}, ${updater}, extra)`,
    `${struct} Struct.evolve?.(${target}, ${updater})`,
    `${struct} Struct?.evolve(${target}, ${updater})`,
    `${struct} Struct.evolve(${updater})?.(${target})`,
    `${struct} import { pipe } from 'effect'; pipe(${target}, addFields, Struct.evolve(${updater}))`,
    `${struct} pipe(${target}, Struct.evolve(${updater}))`,
    `${struct} import { pipe } from 'other'; pipe(${target}, Struct.evolve(${updater}))`,
    `${struct} const model = ${target}; Struct.evolve(model, ${updater})`,
    `${struct} const normalize = ${updater}; Struct.evolve(${target}, normalize)`,
    `${struct} const normalize = ${updater}; Struct.evolve(normalize)(${target})`,
    `${struct} import { pipe } from 'effect'; const normalize = ${updater}; pipe(${target}, Struct.evolve(normalize))`,
    `${struct} const model = ${target}; model.zipCode = 'x'; Struct.evolve(model, ${updater})`,
    `${struct} const model = ${target}; delete model.zip; Struct.evolve(model, ${updater})`,
    `${struct} const model = ${target}; model.name = 'bob'; Struct.evolve(model, ${updater})`,
    `${struct} const model = ${target}; const alias = model; unknown(alias); Struct.evolve(model, ${updater})`,
    `${struct} const normalize = ${updater}; unknown(normalize); Struct.evolve(${target}, normalize)`,
    `${struct} let model = ${target}; Struct.evolve(model, ${updater})`,
    `${struct} const model: { name: string; zipCode?: string } = { name: 'alice' }; Struct.evolve(model, ${updater})`,
    `${struct} const model: Record<string, string> = ${target}; Struct.evolve(model, ${updater})`,
    `${struct} const model: { name: string } | { name: string; zipCode: string } = ${target}; Struct.evolve(model, ${updater})`,
    `${struct} const normalize = ${updater}; Struct.evolve(${target}, normalize);
     Struct.evolve({ name: 'bob', zipCode: '00000' }, normalize)`,
    `${struct} import { model, normalize } from './models'; Struct.evolve(model, ${updater}); Struct.evolve(${target}, normalize)`,
    `${struct} const model = Schema.decodeUnknownSync(Model)(input); Struct.evolve(model, ${updater})`,
    `${struct} const S = Struct; S.evolve(${target}, ${updater})`,
    `${struct} function f(Struct) { Struct.evolve(${target}, ${updater}) }`,
    `${struct} { const Struct = other; Struct.evolve(${target}, ${updater}) }`,
    `import { evolve as update } from 'effect/Struct'; function f(update) { update(${target}, ${updater}) }`,
    `${struct} import { pipe } from 'effect'; function f(pipe) { pipe(${target}, Struct.evolve(${updater})) }`,
    `import type * as Struct from 'effect/Struct'; Struct.evolve(${target}, ${updater})`,
    `import { type Struct } from 'effect'; Struct.evolve(${target}, ${updater})`,
    `import * as Struct from '@effect/platform/Struct'; Struct.evolve(${target}, ${updater})`,
    `import Struct from 'effect/Struct'; Struct.evolve(${target}, ${updater})`,
    ...[
      `{ name: 'alice', ...other }`,
      `{ name: 'alice', [key]: 'x' }`,
      `{ name: 'alice', ['zip']: '00000' }`,
      `{ name: 'alice', [Symbol.iterator]: iterator }`,
      `{ name: 'alice', get zip() { return '00000' } }`,
      `{ name: 'alice', set zip(value) {} }`,
      `{ name: 'alice', __proto__: other }`,
      `{ name: 'alice', 'constructor': other }`,
      `{ name: 'alice', prototype: other }`,
      `(${target} as Record<string, string>)`,
      `(<{ name: string; zipCode?: string }>${target})`,
      `(${target} satisfies Record<string, string>)`,
      `(${target} as const)`,
      `(${target}!)`,
      `wrap(${target})`,
    ].flatMap((ambiguous) => [
      `${struct} Struct.evolve(${ambiguous}, ${updater})`,
      `${struct} Struct.evolve(${target}, ${ambiguous})`,
    ]),
  ],
  invalid: [
    {
      code: `${struct} Struct.evolve(${target}, ${updater})`,
      errors: [{ messageId: 'staleKey', data: { key: 'zipCode' } }],
      output: null,
    },
    {
      code: `import { Struct as S } from 'effect'; S.evolve(${updater})(${target})`,
      errors: [{ messageId: 'staleKey', data: { key: 'zipCode' } }],
      output: null,
    },
    {
      code: `import * as S from 'effect/Struct'; import { pipe as p } from 'effect';
             p(${target}, S.evolve(${updater}))`,
      errors: [{ messageId: 'staleKey', data: { key: 'zipCode' } }],
      output: null,
    },
    {
      code: `import { evolve as update } from 'effect/Struct'; import * as Fn from 'effect/Function';
             Fn.pipe({ 1: 'a', 2: 'b' }, update({ '1': s => s, 3: s => s }), consume)`,
      errors: [{ messageId: 'staleKey', data: { key: '3' } }],
      output: null,
    },
    {
      code: `import * as Effect from 'effect'; Effect.Struct.evolve(${target}, ${updater})`,
      errors: [{ messageId: 'staleKey', data: { key: 'zipCode' } }],
      output: null,
    },
    {
      code: `import { evolve } from 'effect/Struct'; evolve({ '01': 'a', 1e2: 'b' }, { '01': s => s, '100': s => s, '1': s => s })`,
      errors: [{ messageId: 'staleKey', data: { key: '1' } }],
      output: null,
    },
    {
      code: `${struct}
Struct.evolve({ name: 'alice' }, {
  name: s => s,
  zipCode: s => s,
  'zip-code': s => s,
})`,
      errors: [
        {
          messageId: 'staleKey',
          data: { key: 'zipCode' },
          line: 4,
          column: 2,
          endLine: 4,
          endColumn: 9,
          suggestions: null,
        },
        {
          messageId: 'staleKey',
          data: { key: 'zip-code' },
          line: 5,
          column: 2,
          endLine: 5,
          endColumn: 12,
          suggestions: null,
        },
      ],
      output: null,
    },
  ],
});
