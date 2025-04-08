import { writeFile } from 'node:fs/promises';

import type { Linter } from 'eslint';
import { composer } from 'eslint-flat-config-utils';
import { flatConfigsToRulesDTS } from 'eslint-typegen/core';
import { builtinRules } from 'eslint/use-at-your-own-risk';
import { defineBuildConfig } from 'unbuild';

import { dependencies, devDependencies } from './package.json';

export default defineBuildConfig({
  entries: ['./src/index.ts'],

  rollup: {
    esbuild: {
      treeShaking: true,
      minify: true,
    },
    preserveDynamicImports: true,
  },

  declaration: true,

  externals: Object.keys({ ...dependencies, ...devDependencies }),

  hooks: {
    'build:before': generateTypes,
  },
});

async function generateTypes() {
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

  const configNames = configs.map((i) => i.name).filter(Boolean) as string[];

  let dts = await flatConfigsToRulesDTS(configs as Linter.Config[], {
    includeAugmentation: false,
  });

  dts += `
// Names of all the configs
export type ConfigNames = ${configNames.map((i) => `'${i}'`).join(' | ')}
`;

  await writeFile('src/types.gen.d.ts', dts);

  console.log('Generated types.gen.d.ts');
}
