import pluginDepend from 'eslint-plugin-depend';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function depend(): Array<TypedFlatConfigItem> {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:depend',
      plugins: {
        depend: pluginDepend,
      },
      rules: {
        'depend/ban-dependencies': 'warn',
      },
    },
  ];
}
