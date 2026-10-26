import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import * as findUp from 'empathic/find';
import type { FlatConfigItem } from 'oxlint-flat-config';

import { tailwindFunctions } from '@2digits/constants';

import type { OptionsWithTailwind } from '../types';

/**
 * The v4 plugin only loads CSS entrypoints, so expose a discovered `tailwind.config.*` through `@config`. The
 * entrypoint lives in the project's `node_modules/.cache` so `@import 'tailwindcss'` resolves from the project.
 *
 * @param configPath Absolute path to the discovered `tailwind.config.*`.
 *
 * @returns Absolute path to the generated CSS entrypoint.
 */
function writeConfigEntrypoint(configPath: string): string {
  const cacheDir = path.join(path.dirname(configPath), 'node_modules', '.cache', '@2digits', 'oxlint-config');

  const entrypoint = path.join(cacheDir, 'tailwind.css');

  mkdirSync(cacheDir, { recursive: true });

  writeFileSync(entrypoint, `@import 'tailwindcss';\n@config ${JSON.stringify(configPath)};\n`);

  return entrypoint;
}

export function tailwind(options: OptionsWithTailwind = {}): Array<FlatConfigItem> {
  const { overrides = {} } = options;

  let { cssConfigPath } = options;

  if (!cssConfigPath) {
    // Oxlint loads configs synchronously, so the closest Git root stands in for the ESLint config's workspace root.
    const gitEntry = findUp.up('.git');

    const last = gitEntry && path.dirname(gitEntry);

    const config = findUp.file('tailwind.config.ts', { last }) ?? findUp.file('tailwind.config.js', { last });

    if (!config) {
      return [];
    }

    cssConfigPath = writeConfigEntrypoint(config);
  }

  return [
    {
      name: '2digits:tailwind',
      jsPlugins: [
        {
          name: 'tailwindcss',
          specifier: import.meta.resolve('eslint-plugin-tailwindcss'),
        },
      ],
      settings: {
        tailwindcss: {
          functions: tailwindFunctions,
          cssConfigPath,
        },
      },
      rules: {
        'tailwindcss/classnames-order': 'warn',
        'tailwindcss/enforces-canonical-classname': 'warn',
        'tailwindcss/enforces-negative-arbitrary-values': 'warn',
        'tailwindcss/enforces-shorthand': 'warn',
        'tailwindcss/important-modifier-suffix': 'warn',
        'tailwindcss/no-arbitrary-value': 'off',
        'tailwindcss/no-contradicting-classname': 'error',
        'tailwindcss/no-custom-classname': 'warn',
        'tailwindcss/no-unnecessary-arbitrary-value': 'warn',

        ...overrides,
      },
    },
  ];
}
