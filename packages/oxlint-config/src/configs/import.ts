import { defineTypedConfig, type Rules } from '../types';

export const importConfig = defineTypedConfig({
  plugins: ['import'],
  rules: {
    'import/consistent-type-specifier-style': undefined,
    'import/default': 'error',
    'import/export': 'error',
    'import/exports-last': undefined,
    'import/extensions': undefined,
    'import/first': ['error', 'disable-absolute-first'],
    'import/group-exports': undefined,
    'import/max-dependencies': undefined,
    'import/named': undefined,
    'import/namespace': 'error',
    'import/no-absolute-path': 'error',
    'import/no-amd': 'error',
    'import/no-anonymous-default-export': 'error',
    'import/no-commonjs': undefined,
    'import/no-cycle': 'error',
    'import/no-default-export': undefined,
    'import/no-duplicates': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-empty-named-blocks': 'error',
    'import/no-mutable-exports': undefined,
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-named-default': 'error',
    'import/no-named-export': undefined,
    'import/no-namespace': undefined,
    'import/no-nodejs-modules': undefined,
    'import/no-relative-parent-imports': undefined,
    'import/no-self-import': 'error',
    'import/no-unassigned-import': undefined,
    'import/no-webpack-loader-syntax': 'error',
    'import/prefer-default-export': undefined,
    'import/unambiguous': undefined,

    'import/newline-after-import': undefined,
  } satisfies {
    [k in Extract<keyof Rules, `import/${string}`>]: Rules[k];
  },
});
