import { defineTypedConfig, type Rules } from '../types';

export const nodeConfig = defineTypedConfig({
  plugins: ['node'],
  rules: {
    'node/handle-callback-err': 'error',
    'node/no-exports-assign': 'error',
    'node/no-new-require': 'error',
    'node/no-path-concat': 'error',
    'node/callback-return': undefined,

    'node/global-require': undefined,
    'node/no-mixed-requires': undefined,
    'node/no-process-env': undefined,
    'node/no-sync': undefined,
  } satisfies {
    [k in Extract<keyof Rules, `node/${string}`>]: Rules[k];
  },
});
