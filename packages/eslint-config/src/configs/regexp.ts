import pluginRegexp from 'eslint-plugin-regexp';

import type { TypedFlatConfigItem } from '../types';

export function regexp(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:regexp',
      plugins: {
        regexp: pluginRegexp,
      },
      rules: {
        ...pluginRegexp.configs['flat/recommended'].rules,
      },
    },
  ];
}
