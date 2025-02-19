import pluginAntfu from 'eslint-plugin-antfu';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function antfu(): TypedFlatConfigItem[] {
  return [
    {
      files: [GLOB_SRC],
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
