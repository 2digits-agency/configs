import { defineConfig } from 'tsdown';

import { generateTypes } from './scripts/generate-types';

export default defineConfig({
  entry: ['src/index.ts', 'src/base.ts', 'src/typescript.ts'],
  dts: {
    tsgo: true,
  },
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esm-only', level: 'error' },
  publint: { strict: true },
  shims: true,
  hooks(ctx) {
    ctx.hook('build:prepare', async () => {
      await generateTypes();
    });
  },
});
