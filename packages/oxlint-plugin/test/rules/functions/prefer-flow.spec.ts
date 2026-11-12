/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferFlow } from '../../../src/rules/functions/prefer-flow';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const imports = `
  import * as Arr from 'effect/Array'
  import * as Effect from 'effect/Effect'
  import * as Fn from 'effect/Function'
  import * as Opt from 'effect/Option'
  import * as Struct from 'effect/Struct'
`;

tester.run('prefer-flow', preferFlow, {
  valid: [
    // `Arr.map` and `Effect.forEach` also pass an index, which `Fn.flow` would hand to the first function.
    `${imports} Arr.map(rows, (row) => Fn.pipe(row, toDto, Opt.some))`,
    `${imports} Effect.forEach(rows, (row) => row.pipe(Effect.map(toDto), Effect.asVoid))`,
    `${imports} register((row) => Fn.pipe(row, toDto, Opt.some))`,
    // One function is left to `no-forwarding-lambda`.
    `${imports} Effect.map((rows) => rows.pipe(Arr.head))`,
    `${imports} Effect.map((row) => row.pipe(Opt.map((value) => value + row.offset), Opt.getOrElse(() => 0)))`,
    `${imports} Effect.map((id) => repository.load(id).pipe(Effect.map(toDto)))`,
    `${imports} Effect.map((id) => load(id, options).pipe(Effect.map(toDto)))`,
    `${imports} Effect.map((stream) => stream.pipe(destination, transform))`,
    `${imports} Effect.map((row) => row?.pipe(Opt.map(toDto), Opt.getOrNull))`,
    `${imports} Effect.map(function (row) { return Fn.pipe(row, toDto, this.wrap) })`,
    `${imports} Effect.map(async (rows) => Fn.pipe(rows, Arr.head, Opt.getOrNull))`,
    // `Fn.flow` has no overload for ten functions.
    `${imports} Effect.map((x) => Fn.pipe(x, f1, f2, f3, f4, f5, f6, f7, f8, f9, f10))`,
  ],
  invalid: [
    {
      code: `${imports} Effect.map((created) => Arr.head(created).pipe(Opt.map(Struct.get('id')), Opt.getOrElse(() => 0)))`,
      errors: [{ messageId: 'preferFlow', data: { count: '3' } }],
      output: `${imports} Effect.map(Fn.flow(Arr.head, Opt.map(Struct.get('id')), Opt.getOrElse(() => 0)))`,
    },
    {
      // Nested calls run innermost first.
      code: `${imports} Opt.flatMap((source) => Opt.some(Arr.reverse(toPath(source))))`,
      errors: [{ messageId: 'preferFlow', data: { count: '3' } }],
      output: `${imports} Opt.flatMap(Fn.flow(toPath, Arr.reverse, Opt.some))`,
    },
    {
      code: `${imports} Effect.map((rows) => Arr.head(Arr.reverse(rows)).pipe(Opt.map(toDto)))`,
      errors: [{ messageId: 'preferFlow' }],
      output: `${imports} Effect.map(Fn.flow(Arr.reverse, Arr.head, Opt.map(toDto)))`,
    },
    {
      code: `${imports} Effect.map(function (marker) { return marker.pipe(Opt.isSome, Opt.some) })`,
      errors: [{ messageId: 'preferFlow', data: { count: '2' } }],
      output: `${imports} Effect.map(Fn.flow(Opt.isSome, Opt.some))`,
    },
    {
      code: `import { pipe } from 'effect'\nimport * as F from 'effect/Function'\nimport * as Opt from 'effect/Option'\nOpt.map(maybe, (row) => pipe(row, toDto, JSON.stringify))`,
      // `JSON.stringify` is not a module member, so building the flow once could read a different value.
      errors: [
        {
          messageId: 'preferFlow',
          suggestions: [
            {
              messageId: 'useFlow',
              output: `import { pipe } from 'effect'\nimport * as F from 'effect/Function'\nimport * as Opt from 'effect/Option'\nOpt.map(maybe, F.flow(toDto, JSON.stringify))`,
            },
          ],
        },
      ],
      output: null,
    },
    {
      code: `import { pipe } from 'effect'\nimport * as F from 'effect/Function'\nimport * as Opt from 'effect/Option'\nOpt.map(maybe, (row) => pipe(row, toDto, toJson))`,
      errors: [{ messageId: 'preferFlow' }],
      output: `import { pipe } from 'effect'\nimport * as F from 'effect/Function'\nimport * as Opt from 'effect/Option'\nOpt.map(maybe, F.flow(toDto, toJson))`,
    },
    {
      code: `import * as Effect from 'effect/Effect'\nimport * as Opt from 'effect/Option'\nEffect.map((row) => row.pipe(Opt.map(toDto), Opt.getOrNull))`,
      errors: [{ messageId: 'preferFlow' }],
      output: `import * as Fn from 'effect/Function';\nimport * as Effect from 'effect/Effect'\nimport * as Opt from 'effect/Option'\nEffect.map(Fn.flow(Opt.map(toDto), Opt.getOrNull))`,
    },
    {
      // \`Fn.flow\` would build the array once, so every call would return the same, possibly mutated, array.
      code: `${imports} Effect.map((rows) => rows.pipe(Effect.succeed, Effect.as([])))`,
      errors: [
        {
          messageId: 'preferFlow',
          suggestions: [
            { messageId: 'useFlow', output: `${imports} Effect.map(Fn.flow(Effect.succeed, Effect.as([])))` },
          ],
        },
      ],
      output: null,
    },
    {
      // \`MutableRef.get\` would read the limit once, when the flow is built, instead of on every call.
      code: `${imports} import * as MutableRef from 'effect/MutableRef'\nEffect.map((rows) => rows.pipe(Effect.succeed, Effect.as(MutableRef.get(limit))))`,
      errors: [
        {
          messageId: 'preferFlow',
          suggestions: [
            {
              messageId: 'useFlow',
              output: `${imports} import * as MutableRef from 'effect/MutableRef'\nEffect.map(Fn.flow(Effect.succeed, Effect.as(MutableRef.get(limit))))`,
            },
          ],
        },
      ],
      output: null,
    },
    {
      // `config.limit` is read once instead of on every call.
      code: `${imports} Effect.map((rows) => rows.pipe(Arr.take(config.limit), Arr.map(toDto)))`,
      errors: [
        {
          messageId: 'preferFlow',
          suggestions: [
            { messageId: 'useFlow', output: `${imports} Effect.map(Fn.flow(Arr.take(config.limit), Arr.map(toDto)))` },
          ],
        },
      ],
      output: null,
    },
    {
      code: `${imports} Effect.map((rows: ReadonlyArray<Row>) => Fn.pipe(rows, Arr.head, Opt.getOrNull))`,
      errors: [
        {
          messageId: 'preferFlow',
          suggestions: [{ messageId: 'useFlow', output: `${imports} Effect.map(Fn.flow(Arr.head, Opt.getOrNull))` }],
        },
      ],
      output: null,
    },
    {
      // The callback reads `step` when it runs, `Fn.flow` when it is built.
      code: `${imports} let step = Arr.head; step = Arr.last; Effect.map((rows) => rows.pipe(step, Opt.getOrNull))`,
      errors: [{ messageId: 'preferFlow', suggestions: null }],
      output: null,
    },
  ],
});
