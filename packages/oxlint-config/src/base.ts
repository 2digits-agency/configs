import { defineConfig } from 'oxlint';

const ignorePatterns = ['**/node_modules', '**/dist', '**/.turbo', '**/coverage', '**/.next', '**/.vercel'] as const;

export const baseConfig = defineConfig({
  ignorePatterns: [...ignorePatterns],
  plugins: ['eslint', 'import', 'unicorn'],
  rules: {
    eqeqeq: ['error', 'smart'],
    'no-alert': 'error',
    'no-debugger': 'error',
    'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
    'no-unused-vars': [
      'error',
      {
        args: 'none',
        caughtErrors: 'none',
        vars: 'all',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
      },
    ],
    'prefer-const': ['error', { destructuring: 'all', ignoreReadBeforeAssign: true }],

    'import/first': 'error',
    'import/no-duplicates': 'error',

    'unicorn/error-message': 'error',
    'unicorn/no-array-for-each': 'error',
    'unicorn/prefer-node-protocol': 'error',
  },
});
