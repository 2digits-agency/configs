import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noMutableModuleState } from '../../../src/rules/smells/no-mutable-module-state';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

tester.run('no-mutable-module-state', noMutableModuleState, {
  valid: [
    'const limit = 10; export function f() { return limit; }',
    // Only reassignment counts; mutating a `const` container is not reassignment.
    'const cache = new Map(); export function f(k, v) { cache.set(k, v); }',
    // Reassigned only at the top level.
    'let mode = "a"; if (flag) mode = "b"; export const current = mode;',
    // Locals inside functions are not module state.
    'export function f() { let n = 0; n += 1; return n; }',
    {
      code: 'let calls = 0; export function f() { calls += 1; }',
      filename: 'counter.test.ts',
    },
  ],
  invalid: [
    {
      code: 'let calls = 0; export function f() { calls += 1; } export function g() { calls = 0; calls++; }',
      errors: [{ messageId: 'mutableModuleState', data: { name: 'calls', functions: '2 functions' } }],
    },
    {
      code: 'var client; export const getClient = () => (client ??= connect());',
      errors: [{ messageId: 'mutableModuleState', data: { name: 'client', functions: '1 function' } }],
    },
    {
      code: 'export let calls = 0; export function tick() { calls++; }',
      errors: [{ messageId: 'mutableModuleState', data: { name: 'calls', functions: '1 function' } }],
    },
    {
      code: 'export var { a, b } = defaults; export function reset() { b = 2; }',
      errors: [{ messageId: 'mutableModuleState', data: { name: 'b', functions: '1 function' } }],
    },
    {
      // Destructured bindings are reported one by one.
      code: 'let { a, b } = defaults; export function reset() { a = 1; }',
      errors: [{ messageId: 'mutableModuleState', data: { name: 'a', functions: '1 function' } }],
    },
  ],
});
