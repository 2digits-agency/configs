import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import configs from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import type { TypedFlatConfigItem } from '../types';

const recommended = renamePluginsInRules(configs.recommended.rules as never, PluginNameMap);

export function comments(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:comments',
      plugins: {
        comments: pluginComments,
      },
      rules: {
        ...recommended,

        'comments/no-unused-disable': 'error',
      },
    },
  ];
}
