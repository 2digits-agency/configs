import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noSingleUsePrivateFunction } from '../../../src/rules/functions/no-single-use-private-function';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts', ecmaFeatures: { jsx: true } },
    sourceType: 'module',
  },
});

tester.run('no-single-use-private-function', noSingleUsePrivateFunction, {
  valid: [
    'function double(x) { return x * 2 }\nexport const a = double(1)\nexport const b = double(2)',
    'export function double(x) { return x * 2 }\nexport const a = double(1)',
    'function double(x) { return x * 2 }\nexport const a = double(1)\nexport { double }',
    'const double = (x) => x * 2\nexport const a = double(1)\nexport default double',
    'function walk(node) { return node.children.map(walk) }\nexport const tree = walk(root)',
    'function unused(x) { return x }',
    'function isMode(value: string): value is Mode { return modes.has(value) }\nexport const a = values.filter(isMode)',
    'function countdown(n) { return n > 0 ? countdown(n - 1) : 0 }',
    'const limit = 10\nexport const a = limit',
    'function Row() { return null }\nexport function Table() { return Row() }',
    'function useRows() { return [] }\nexport function Table() { return useRows() }',
    'export function run() { function inner(x) { return x } return inner(1) }',
    'function total(items) {\n  const sum = add(items)\n\n  return sum\n}\nexport const a = total([])',
    {
      code: 'const Row = () => null\nexport const Table = () => <Row />',
      filename: 'table.tsx',
    },
  ],
  invalid: [
    {
      code: 'function total(items) {\n  const sum = add(items)\n\n  return sum\n}\nexport const a = total([])',
      options: [{ maxLines: 5 }],
      errors: [{ messageId: 'singleUse', data: { name: 'total' } }],
    },
    {
      code: 'function double(x) { return x * 2 }\nexport const a = double(1)',
      errors: [{ messageId: 'singleUse', data: { name: 'double' } }],
    },
    {
      code: 'const toRow = (user) => user.name\nexport const rows = users.map(toRow)',
      errors: [{ messageId: 'singleUse', data: { name: 'toRow' } }],
    },
    {
      code: `
        import * as Effect from 'effect/Effect'
        const step = Effect.fn('step')(function* () { yield* Effect.log('step') })
        export const program = Effect.gen(function* () { yield* step() })
      `,
      errors: [{ messageId: 'singleUse', data: { name: 'step' } }],
    },
  ],
});
