import { renamePluginsInRules } from 'eslint-flat-config-utils';

import { PluginNameMap } from '../constants';
import { pluginSonar } from '../plugins';
import type { TypedFlatConfigItem } from '../types';

const rules = renamePluginsInRules(pluginSonar.configs.recommended.rules as never, PluginNameMap);

export function sonar(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:sonar',
      plugins: {
        sonar: pluginSonar,
      },
      rules: {
        ...rules,

        'sonar/no-redundant-jump': 'off',
      },
    },
  ];
}
