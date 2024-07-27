import { writeFile } from 'node:fs/promises';

import { composer } from 'eslint-flat-config-utils';
import { flatConfigsToRulesDTS } from 'eslint-typegen/core';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { defineConfig } from 'tsup';

import { name } from './package.json';

export default defineConfig({
  minify: true,
  target: 'esnext',
  sourcemap: true,
  treeshake: true,
  format: ['esm', 'cjs'],
  entry: ['./src/index.ts'],
  clean: true,
  dts: true,
  shims: true,
  name,
  plugins: [
    {
      name: 'eslint-typegen',
      async buildStart() {
        const configs = await composer(
          {
            plugins: {
              '': {
                rules: Object.fromEntries(builtinRules.entries()) as Record<never, never>,
              },
            },
          },
          ...(Object.values(await import('./src/configs')).map((config) => config()) as []),
        );

        const configNames = configs.map((i) => i.name).filter(Boolean) as string[];

        let dts = await flatConfigsToRulesDTS(configs, {
          includeAugmentation: false,
        });

        dts += `
// Names of all the configs
export type ConfigNames = ${configNames.map((i) => `'${i}'`).join(' | ')}
`;

        return writeFile('src/types.gen.d.ts', dts);
      },
    },
  ],
});
