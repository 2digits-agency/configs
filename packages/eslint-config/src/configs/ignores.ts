import flatIgnore from 'eslint-config-flat-gitignore';

import { GLOB_EXCLUDE } from '../globs';
import type { OptionsWithIgnores, TypedFlatConfigItem } from '../types';

export function ignores(options: OptionsWithIgnores = {}): TypedFlatConfigItem[] {
  const { gitIgnore, ignores = [] } = options;

  return [
    {
      ignores: [GLOB_EXCLUDE, ignores].flat(),
      name: '2digits:ignores',
    },
    flatIgnore({ strict: false, ...gitIgnore, name: '2digits:gitignore' }),
  ];
}
