import { defineConfig } from 'oxlint';

export const nodeConfig = defineConfig({
  plugins: ['node'],
  rules: {
    'node/callback-return': 'off',
    'node/exports-style': ['error', 'module.exports'],
    'node/global-require': 'off',
    'node/handle-callback-err': ['error', '^(err|error)$'],
    'node/no-exports-assign': 'error',
    'node/no-mixed-requires': 'error',
    'node/no-new-require': 'error',
    'node/no-path-concat': 'error',
    'node/no-process-env': 'off',
    'node/no-sync': 'off',
    'node/no-top-level-await': 'off',
  },
});
