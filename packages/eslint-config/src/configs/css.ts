import plugin from '@eslint/css';
import { tailwindSyntax } from '@eslint/css/syntax';

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
        customSyntax: tailwindSyntax,
      },
      rules: {
        ...plugin.configs.recommended.rules,
      },
    },
  ];
}
