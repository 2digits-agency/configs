import * as Str from 'effect/String';
import { defineConfig } from 'vite-plus';

import pkg from './package.json';

export default defineConfig({
  pack: {
    entry: ['src/bin.ts'],
    // This private executable has no library API to emit or validate declarations for.
    dts: false,
    fixedExtension: true,
    exports: true,
    publint: { strict: true },
    plugins: [
      {
        name: 'replace-version',
        transform(code) {
          if (!Str.includes('__REPLACE_VERSION__')(code)) {
            return;
          }

          return Str.replaceAll('__REPLACE_VERSION__', pkg.version)(code);
        },
      },
    ],
  },
  test: {
    setupFiles: ['./test/vitest.setup.ts'],
    include: ['test/**/*.spec.ts'],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: false,
    },
  },
});
