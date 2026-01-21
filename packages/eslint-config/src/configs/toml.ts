import eslintPluginToml from 'eslint-plugin-toml';

import { GLOB_TOML } from '../globs';
import type { TypedFlatConfigItem } from '../types';

const standard = Object.fromEntries(
  eslintPluginToml.configs.standard.flatMap(({ rules }) => Object.entries({ ...rules })),
);

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
        'toml/indent': ['error', 2, { keyValuePairs: 1, subTables: 1 }],
      },
    },
  ];
}
