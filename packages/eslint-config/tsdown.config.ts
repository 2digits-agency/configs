import { writeFile } from 'node:fs/promises';

import { composer } from 'eslint-flat-config-utils';
import { flatConfigsToRulesDTS } from 'eslint-typegen/core';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],

  dts: true,
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esm-only', level: 'error' },
  publint: { strict: true },

  shims: true,

  noExternal: ['eslint-plugin-react-hooks', 'zod-validation-error', 'zod'],

  hooks(ctx) {
    ctx.hook('build:prepare', async () => {
      const configs = await composer(
        {
          plugins: {
            '': {
              // eslint-disable-next-line ts/no-deprecated
              rules: Object.fromEntries(builtinRules.entries()) as Record<never, never>,
            },
          },
        },
        ...(Object.values(await import('./src/configs')).map((config) => config()) as []),
      );

      const configNames = configs.map((i) => i.name).filter(Boolean) as Array<string>;

      let dts = await flatConfigsToRulesDTS(configs as never, {
        includeAugmentation: false,
      });

      dts += `
// Names of all the configs
export type ConfigNames = ${configNames.map((i) => `'${i}'`).join(' | ')}
`;

      await writeFile('src/types.gen.d.ts', dts);

      console.log('Generated types.gen.d.ts');
    });
  },
});
