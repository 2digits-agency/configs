import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import configs from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

const recommended = renamePluginsInRules(configs.recommended.rules as never, PluginNameMap);

export function comments(): TypedFlatConfigItem[] {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:comments',
      plugins: {
        comments: pluginComments,
      },
      rules: {
        ...recommended,

        'comments/no-unused-disable': 'error',
        'comments/disable-enable-pair': ['error', { allowWholeFile: true }],
      },
    },
  ];
}
