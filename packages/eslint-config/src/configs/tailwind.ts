import * as findUp from 'empathic/find';
import { findWorkspaceDir } from 'pkg-types';

import { GLOB_SRC } from '../globs';
import type { OptionsOverrides, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function tailwind(options: OptionsOverrides = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const [tailwindcss, { tailwindFunctions }, last] = await Promise.all([
    interopDefault(import('eslint-plugin-tailwindcss')),
    interopDefault(import('@2digits/constants')),
    findWorkspaceDir().catch(() => undefined),
  ]);

  const config = findUp.file('tailwind.config.ts', { last }) ?? findUp.file('tailwind.config.js', { last });

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
