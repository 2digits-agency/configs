import yml from 'eslint-plugin-yml';
import * as parser from 'yaml-eslint-parser';

import { GLOB_YAML } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function yaml(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:yaml/setup',
      plugins: {
        yml,
      },
    },

    {
      name: '2digits:yaml/base',
      ...SHARED_OPTIONS,
      rules: {
        'no-irregular-whitespace': 'off',
        'no-unused-vars': 'off',
        'spaced-comment': 'off',
      },
    },

    {
      name: '2digits:yaml/recommended',
      ...SHARED_OPTIONS,
      rules: {
        'yml/no-empty-document': 'error',
        'yml/no-empty-key': 'error',
        'yml/no-empty-mapping-value': 'error',
        'yml/no-empty-sequence-entry': 'error',
        'yml/no-irregular-whitespace': 'error',
        'yml/no-tab-indent': 'error',
        'yml/vue-custom-block/no-parsing-error': 'error',
      },
    },

    {
      name: '2digits:yaml/standard',
      ...SHARED_OPTIONS,
      rules: {
        'yml/block-mapping': 'error',
        'yml/block-sequence': 'error',
        'yml/plain-scalar': 'error',
        'yml/spaced-comment': 'error',
      },
    },

    {
      name: '2digits:yaml/prettier',
      ...SHARED_OPTIONS,
      rules: {
        'yml/block-mapping-colon-indicator-newline': 'off',
        'yml/block-mapping-question-indicator-newline': 'off',
        'yml/block-sequence-hyphen-indicator-newline': 'off',
        'yml/flow-mapping-curly-newline': 'off',
        'yml/flow-mapping-curly-spacing': 'off',
        'yml/flow-sequence-bracket-newline': 'off',
        'yml/flow-sequence-bracket-spacing': 'off',
        'yml/indent': 'off',
        'yml/key-spacing': 'off',
        'yml/no-multiple-empty-lines': 'off',
        'yml/no-trailing-zeros': 'off',
        'yml/quotes': 'off',
      },
    },
  ];
}

const SHARED_OPTIONS = {
  files: [GLOB_YAML],
  languageOptions: {
    parser,
  },
} satisfies Pick<TypedFlatConfigItem, 'languageOptions' | 'files'>;
