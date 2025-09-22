import { defineConfig } from 'tsdown';
import Replace from 'unplugin-replace';

import pkg from './package.json';

export default defineConfig({
  entry: ['src/bin.ts'],

  dts: true,
  fixedExtension: true,
  exports: true,
  platform: 'node',
  target: 'node20',
  clean: true,

  plugins: [
    Replace.rolldown({
      __REPLACE_VERSION__: () => pkg.version,
    }),
  ],

  // Externalize all dependencies and problematic transitive deps
  external: [
    ...Object.keys(pkg.dependencies ?? {}),
    // Use regex to match @effect and @effect/* imports
    /^@effect\//,
    // Transitive dependencies that cause issues when bundled
    'nypm',
    'pkg-types'
  ],
});
