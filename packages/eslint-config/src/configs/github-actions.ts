import { configs, plugin } from 'eslint-plugin-github-action';
import parser from 'yaml-eslint-parser';

import { GLOB_GITHUB_ACTIONS } from '../globs';
import type { TypedFlatConfigItem } from '../types';

const recommendedRules = Object.fromEntries(configs.recommended.flatMap(({ rules }) => Object.entries({ ...rules })));

export function githubActions(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:github-actions/setup',
      plugins: {
        'github-action': plugin,
      },
    },

    {
      name: '2digits:github-actions/recommended',
      files: [GLOB_GITHUB_ACTIONS],
      ignores: [`!**/${GLOB_GITHUB_ACTIONS}`],
      languageOptions: {
        parser,
      },
      rules: {
        ...recommendedRules,
      },
    },
  ];
}
