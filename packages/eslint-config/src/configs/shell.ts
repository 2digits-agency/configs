import plugin from '@eslint/shell';

import { GLOB_SHELL } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function shell(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:shell',
      files: [GLOB_SHELL],
      language: 'shell/bash',
      plugins: {
        shell: plugin,
      },
      // The plugin types its recommended severities as `string`.
      rules: plugin.configs.recommended.rules as never,
    },
  ];
}
