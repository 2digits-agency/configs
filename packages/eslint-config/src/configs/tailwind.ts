import * as findUp from 'empathic/find';
import { findWorkspaceDir } from 'pkg-types';

import { GLOB_SRC } from '../globs';
import type { OptionsTailwind, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

const CSS_CONFIG_CANDIDATES = [
  'src/styles.css',
  'src/style.css',
  'src/globals.css',
  'src/index.css',
  'src/app.css',
  'src/tailwind.css',
  'app/globals.css',
  'styles/globals.css',
  'styles/tailwind.css',
  'styles.css',
  'globals.css',
] as const;

function findCssConfigPath(last?: string): string | undefined {
  for (const candidate of CSS_CONFIG_CANDIDATES) {
    const found = findUp.file(candidate, { last });

    if (found) {
      return found;
    }
  }

  return undefined;
}

export async function tailwind(options: OptionsTailwind = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {}, cssConfigPath: cssConfigPathOption } = options;

  const [tailwindcss, { tailwindFunctions }, last] = await Promise.all([
    interopDefault(import('eslint-plugin-tailwindcss')),
    interopDefault(import('@2digits/constants')),
    findWorkspaceDir().catch(() => undefined),
  ]);

  const cssConfigPath = cssConfigPathOption ?? findCssConfigPath(last);

  return [
    {
      files: [GLOB_SRC],
      name: '2digits:tailwind',
      plugins: {
        tailwindcss,
      },
      settings: {
        tailwindcss: {
          functions: tailwindFunctions,
          ...(cssConfigPath ? { cssConfigPath } : {}),
        },
      },
      rules: {
        ...tailwindcss.configs.recommended.rules,

        ...overrides,
      },
    },
  ];
}
