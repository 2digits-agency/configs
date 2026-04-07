import { defineTypedConfig } from '../types';

export const importConfig = defineTypedConfig({
  plugins: ['import'],
  rules: {
    'import/default': 'error',
    'import/export': 'error',
    'import/first': ['error', 'disable-absolute-first'],
    'import/namespace': 'error',
    'import/no-amd': 'error',
    'import/no-anonymous-default-export': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-self-import': 'error',
    'import/no-webpack-loader-syntax': 'error',
  },
});
