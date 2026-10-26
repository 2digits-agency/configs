import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import configs from '@eslint-community/eslint-plugin-eslint-comments/configs';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';
import { renameRules } from '../utils';

const recommended = renameRules(configs.recommended.rules);

export function comments(): Array<TypedFlatConfigItem> {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:comments',
      plugins: {
        comments: pluginComments,
      },
      rules: {
        ...recommended,

        'comments/disable-enable-pair': ['error', { allowWholeFile: true }],
      },
    },
  ];
}
