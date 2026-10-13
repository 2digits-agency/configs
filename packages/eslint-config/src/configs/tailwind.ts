import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import * as findUp from 'empathic/find';
import { findWorkspaceDir } from 'pkg-types';

import { GLOB_SRC } from '../globs';
import type { OptionsWithTailwind, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

/**
 * The v4 plugin only loads CSS entrypoints, so expose a discovered `tailwind.config.*` through `@config`. The
 * entrypoint lives in the project's `node_modules/.cache` so `@import 'tailwindcss'` resolves from the project.
 *
 * @param configPath - Absolute path to the discovered `tailwind.config.*`.
 *
 * @returns Absolute path to the generated CSS entrypoint.
 */
async function writeConfigEntrypoint(configPath: string): Promise<string> {
  const cacheDir = path.join(path.dirname(configPath), 'node_modules', '.cache', '@2digits', 'eslint-config');

  const entrypoint = path.join(cacheDir, 'tailwind.css');

  await mkdir(cacheDir, { recursive: true });

  await writeFile(entrypoint, `@import 'tailwindcss';\n@config ${JSON.stringify(configPath)};\n`);

  return entrypoint;
}

export async function tailwind(options: OptionsWithTailwind = {}): Promise<Array<TypedFlatConfigItem>> {
  const { overrides = {} } = options;

  const [tailwindcss, { tailwindFunctions }, last] = await Promise.all([
    interopDefault(import('eslint-plugin-tailwindcss')),
    interopDefault(import('@2digits/constants')),
    findWorkspaceDir().catch(() => undefined),
  ]);

  let { cssConfigPath } = options;

  if (!cssConfigPath) {
    const config = findUp.file('tailwind.config.ts', { last }) ?? findUp.file('tailwind.config.js', { last });

    if (!config) {
      return [];
    }

    cssConfigPath = await writeConfigEntrypoint(config);
  }

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
          cssConfigPath,
        },
      },
      rules: {
        ...tailwindcss.configs.recommended.rules,

        ...overrides,
      },
    },
  ];
}
