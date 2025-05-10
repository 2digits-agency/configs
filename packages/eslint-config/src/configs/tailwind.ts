import { findUp } from 'find-up';

import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function tailwind(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const [tailwindcss, { tailwindFunctions }, config] = await Promise.all([
    interopDefault(import('eslint-plugin-tailwindcss')),
    interopDefault(import('@2digits/constants')),
    findUp(['tailwind.config.ts', 'tailwind.config.js']),
  ]);

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:tailwind',
      plugins: {
        tailwindcss,
      },
      settings: {
        tailwindcss: {
          callees: tailwindFunctions,
          config,
        },
      },
      rules: {
        ...tailwindcss.configs.recommended.rules,

        ...overrides,
      },
    },
  ];
}
