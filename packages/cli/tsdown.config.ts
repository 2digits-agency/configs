import { defineConfig } from 'tsdown';
import Replace from 'unplugin-replace';

import pkg from './package.json';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],

  dts: true,
  fixedExtension: true,
  exports: true,

  plugins: [
    Replace.rolldown({
      __REPLACE_VERSION__: () => pkg.version,
    }),
  ],
});
