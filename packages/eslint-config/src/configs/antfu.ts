import pluginAntfu from 'eslint-plugin-antfu';

import type { TypedFlatConfigItem } from '../types';

export function antfu(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:antfu',
      plugins: {
        antfu: pluginAntfu,
      },
      rules: {
        'antfu/if-newline': 'error',
        'antfu/top-level-function': 'error',
      },
    },
  ];
}
