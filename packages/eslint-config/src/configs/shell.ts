import plugin from '@eslint/shell';

import { GLOB_MARKDOWN, GLOB_SHELL } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function shell(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:shell',
      files: [GLOB_SHELL],
      // Shell blocks in Markdown often hold placeholders like `<package>` that fail to parse.
      ignores: [`${GLOB_MARKDOWN}/**`],
      language: 'shell/bash',
      plugins: {
        shell: plugin,
      },
      // The plugin types its recommended severities as `string`.
      rules: plugin.configs.recommended.rules as never,
    },
  ];
}
