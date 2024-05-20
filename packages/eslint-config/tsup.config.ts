import { writeFile } from 'node:fs/promises';

import { defineConfig } from 'tsup';

import { name } from './package.json';

export default defineConfig({
  minify: true,
  target: 'esnext',
  sourcemap: true,
  treeshake: true,
  format: ['esm', 'cjs'],
  entry: ['./src/eslint.config.ts'],
  clean: true,
  dts: true,
  shims: true,
  name,
  plugins: [
    {
      name: 'eslint-typegen',
      async buildStart() {
        const [{ twoDigitsConfig }, { flatConfigsToRulesDTS }] = await Promise.all([
          import('./src/eslint.config.js'),
          import('eslint-typegen/core'),
        ]);

        const dts = await flatConfigsToRulesDTS(await twoDigitsConfig(), {
          includeAugmentation: false,
        });

        return writeFile('src/types.gen.d.ts', dts);
      },
    },
  ],
});
