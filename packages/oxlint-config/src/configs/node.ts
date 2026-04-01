import { defineTypedConfig } from '../types';

export const nodeConfig = defineTypedConfig({
  plugins: ['node'],
  rules: {
    'node/handle-callback-err': 'error',
    'node/no-exports-assign': 'error',
    'node/no-new-require': 'error',
    'node/no-path-concat': 'error',
  },
});
