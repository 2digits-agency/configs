import pluginRegexp from 'eslint-plugin-regexp';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function regexp(): Array<TypedFlatConfigItem> {
  return [
    {
      files: [GLOB_SRC],
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
