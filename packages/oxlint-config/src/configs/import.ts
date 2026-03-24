import { defineConfig } from 'oxlint';

export const importConfig = defineConfig({
  plugins: ['import'],
  rules: {
    'import/default': 'error',
    'import/export': 'error',
    'import/first': 'error',
    'import/namespace': 'error',
    'import/no-duplicates': 'error',
    'import/no-self-import': 'error',
    'import/no-webpack-loader-syntax': 'error',
  },
});
