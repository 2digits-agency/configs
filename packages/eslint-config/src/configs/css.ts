import plugin from '@eslint/css';
import { tailwind3 } from 'tailwind-csstree';

import { GLOB_CSS } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function css(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:css',
      files: [GLOB_CSS],
      language: 'css/css',
      plugins: {
        css: plugin,
      },
      languageOptions: {
        tolerant: true,
        customSyntax: tailwind3,
      },
      rules: {
        ...plugin.configs.recommended.rules,
      },
    },
  ];
}
