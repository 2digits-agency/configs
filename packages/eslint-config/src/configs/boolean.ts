import pluginDeMorgan from 'eslint-plugin-de-morgan';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function boolean(): Array<TypedFlatConfigItem> {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:boolean',
      plugins: {
        boolean: pluginDeMorgan,
      },
      rules: {
        ...pluginDeMorgan.configs.recommended.rules,
      },
    },
  ];
}
