import { defineConfig } from 'oxlint';

export const nodeConfig = defineConfig({
  plugins: ['node'],
  rules: {
    'node/handle-callback-err': ['error', '^(err|error)$'],
    'node/no-exports-assign': 'error',
    'node/no-new-require': 'error',
    'node/no-path-concat': 'error',
    'node/callback-return': undefined,

    'node/global-require': undefined,
    'node/no-mixed-requires': undefined,
    'node/no-process-env': undefined,
    'node/no-sync': undefined,
    'node/no-top-level-await': undefined,
  },
});
