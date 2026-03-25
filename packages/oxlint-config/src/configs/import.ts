import { defineTypedConfig } from '../types';

export const importConfig = defineTypedConfig({
  plugins: ['import'],
  rules: {
    'import/default': 'error',
    'import/export': 'error',
    'import/first': 'error',
    'import/namespace': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-self-import': 'error',
    'import/no-unassigned-import': 'error',
    'import/no-webpack-loader-syntax': 'error',
  },
});
