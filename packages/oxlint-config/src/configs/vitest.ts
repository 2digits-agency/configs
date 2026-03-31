import { defineTypedConfig } from '../types';

export const vitestConfig = defineTypedConfig({
  plugins: ['vitest'],

  settings: {
    vitest: { typecheck: true },
  },

  rules: {
    'vitest/consistent-each-for': ['error', { describe: 'for', suite: 'for', it: 'for', test: 'for' }],
    'vitest/consistent-test-filename': [
      'error',
      { pattern: String.raw`.*\.spec\.[tj]sx?$`, allTestPattern: String.raw`.*\.(test|spec)\.[tj]sx?$` },
    ],
    'vitest/consistent-vitest-vi': ['error', { fn: 'vi' }],
    'vitest/hoisted-apis-on-top': 'error',
    'vitest/no-conditional-tests': 'error',
    'vitest/no-import-node-test': 'error',
    'vitest/prefer-called-exactly-once-with': 'error',
    'vitest/prefer-called-once': 'error',
    'vitest/prefer-describe-function-title': 'error',
    'vitest/prefer-expect-type-of': 'error',
    'vitest/prefer-import-in-mock': 'error',
    'vitest/prefer-to-be-falsy': 'error',
    'vitest/prefer-to-be-object': 'error',
    'vitest/prefer-to-be-truthy': 'error',
    'vitest/require-awaited-expect-poll': 'error',
    'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
    'vitest/require-mock-type-parameters': 'error',
    'vitest/warn-todo': 'error',
  },
});
