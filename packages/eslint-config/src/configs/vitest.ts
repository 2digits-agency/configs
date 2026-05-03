import { GLOB_TESTS } from '../globs';
import type { OptionsOverrides, OptionsWithVitest, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function vitest(options: OptionsWithVitest & OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { files = [GLOB_TESTS], overrides = {}, typecheck = true, vitestImports } = options;

  const plugin = await interopDefault(import('@vitest/eslint-plugin'));

  return [
    {
      name: '2digits:vitest/setup',
      plugins: {
        vitest: plugin,
      },
    },
    {
      name: '2digits:vitest/rules',
      files,
      languageOptions: {
        globals: plugin.environments.env.globals,
      },
      settings: {
        vitest: {
          typecheck,
          ...(vitestImports ? { vitestImports } : {}),
        },
      },
      rules: {
        'vitest/consistent-each-for': ['error', { describe: 'for', suite: 'for', it: 'for', test: 'for' }],
        'vitest/consistent-test-filename': [
          'error',
          { pattern: String.raw`.*\.spec\.[tj]sx?$`, allTestPattern: String.raw`.*\.(test|spec)\.[tj]sx?$` },
        ],
        'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
        'vitest/consistent-vitest-vi': ['error', { fn: 'vi' }],
        'vitest/hoisted-apis-on-top': 'error',
        'vitest/no-conditional-tests': 'error',
        'vitest/no-import-node-test': 'error',
        'vitest/prefer-called-exactly-once-with': 'error',
        'vitest/prefer-called-once': 'error',
        'vitest/prefer-describe-function-title': 'error',
        'vitest/prefer-each': 'error',
        'vitest/prefer-expect-type-of': 'error',
        'vitest/prefer-import-in-mock': 'error',
        'vitest/prefer-to-be-falsy': 'error',
        'vitest/prefer-to-be-object': 'error',
        'vitest/prefer-to-be-truthy': 'error',
        'vitest/require-awaited-expect-poll': 'error',
        'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
        'vitest/require-mock-type-parameters': 'error',
        'vitest/warn-todo': 'error',
        'vitest/expect-expect': 'error',
        'vitest/max-expects': 'error',
        'vitest/max-nested-describe': 'error',
        'vitest/no-alias-methods': 'error',
        'vitest/no-commented-out-tests': 'error',
        'vitest/no-conditional-expect': 'error',
        'vitest/no-conditional-in-test': 'error',
        'vitest/no-disabled-tests': 'error',
        'vitest/no-duplicate-hooks': 'error',
        'vitest/no-focused-tests': 'error',
        'vitest/no-identical-title': 'error',
        'vitest/no-interpolation-in-snapshots': 'error',
        'vitest/no-mocks-import': 'error',
        'vitest/prefer-to-contain': 'error',
        'vitest/prefer-todo': 'error',
        'vitest/require-top-level-describe': 'error',
        'vitest/valid-expect': 'error',

        ...overrides,
      },
    },
  ];
}
