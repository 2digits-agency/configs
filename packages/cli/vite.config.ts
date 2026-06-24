import path from 'node:path';

import Replace from 'unplugin-replace';
import { defineConfig } from 'vite-plus';
import type { PackUserConfig } from 'vite-plus/pack';

import pkg from './package.json';

export default defineConfig({
  resolve: {
    alias: {
      'vite-plus/test': 'vitest',
    },
  },
  pack: {
    entry: ['src/bin.ts'],
    dts: true,
    fixedExtension: true,
    exports: true,
    attw: { profile: 'esm-only', level: 'error' },
    publint: { strict: true },
    plugins: [
      Replace.rolldown({
        __REPLACE_VERSION__: () => pkg.version,
      }),
    ] as NonNullable<PackUserConfig['plugins']>,
  },
  test: {
    setupFiles: [path.join(__dirname, 'test/vitest.setup.ts')],
    include: ['test/**/*.spec.ts'],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: false,
    },
  },
});
