import { pluginNode } from '../plugins';
import type { TypedFlatConfigItem } from '../types';

export function node(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:node',
      settings: {
        version: '>= 20.0.0',
      },
      plugins: {
        node: pluginNode,
      },
      rules: {
        'node/handle-callback-err': ['error', '^(err|error)$'],
        'node/no-deprecated-api': 'error',
        'node/no-exports-assign': 'error',
        'node/no-new-require': 'error',
        'node/no-path-concat': 'error',
        'node/no-unsupported-features/node-builtins': 'warn',
        'node/prefer-global/buffer': 'error',
        'node/prefer-global/process': 'error',
        'node/prefer-global/text-encoder': 'error',
        'node/prefer-global/url': 'error',
        'node/prefer-global/console': 'error',
        'node/prefer-global/url-search-params': 'error',
        'node/prefer-global/text-decoder': 'error',
        'node/process-exit-as-throw': 'error',
      },
    },
  ];
}
