import { defineConfig } from 'tsdown';
import Replace from 'unplugin-replace';

import pkg from './package.json';

export default defineConfig({
  entry: ['src/bin.ts'],

  dts: {
    tsgo: true,
  },
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esm-only', level: 'error' },
  publint: { strict: true },

  plugins: [
    Replace.rolldown({
      __REPLACE_VERSION__: () => pkg.version,
    }),
  ],
});
