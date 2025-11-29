import { defineConfig } from 'tsdown';
import Replace from 'unplugin-replace';

import pkg from './package.json';

export default defineConfig({
  entry: ['src/bin.ts'],

  dts: true,
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esmOnly', level: 'error' },
  publint: { strict: true },

  plugins: [
    Replace.rolldown({
      __REPLACE_VERSION__: () => pkg.version,
    }),
  ],
});
