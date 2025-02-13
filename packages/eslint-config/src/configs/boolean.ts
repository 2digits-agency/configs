import pluginDeMorgan from 'eslint-plugin-de-morgan';

import type { TypedFlatConfigItem } from '../types';

export function boolean(): TypedFlatConfigItem[] {
  return [
    {
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
