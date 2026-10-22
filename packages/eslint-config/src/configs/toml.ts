import eslintPluginToml, { configs } from 'eslint-plugin-toml';

import { GLOB_MISE_TOML, GLOB_TOML } from '../globs';
import type { TypedFlatConfigItem } from '../types';
import { mergeRules } from '../utils';

const standard = mergeRules(configs.standard);

export function toml(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:toml',
      files: [GLOB_TOML],
      language: 'toml/toml',
      plugins: {
        toml: eslintPluginToml,
      },
      rules: {
        ...standard,

        'toml/array-bracket-spacing': ['error', 'never'],
        'toml/array-element-newline': ['error', 'consistent'],
        'toml/indent': ['error', 2, { keyValuePairs: 0, subTables: 0 }],
      },
    },
    {
      name: '2digits:toml:mise',
      files: [GLOB_MISE_TOML],
      rules: {
        'toml/spaced-comment': ['off'],
      },
    },
  ];
}
