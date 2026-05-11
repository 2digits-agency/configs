import plugin from 'react-doctor/eslint-plugin';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function reactDoctor(): Array<TypedFlatConfigItem> {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:react-doctor',
      plugins: {
        'react-doctor': plugin,
      },

      rules: {
        ...plugin.configs.recommended.rules,
      },
    },
  ];
}
