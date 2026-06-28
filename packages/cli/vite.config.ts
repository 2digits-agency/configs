import path from 'node:path';

import { defineConfig } from 'vite-plus';

import pkg from './package.json';

export default defineConfig({
  pack: {
    entry: ['src/bin.ts'],
    dts: true,
    fixedExtension: true,
    exports: true,
    attw: { profile: 'esm-only', level: 'error' },
    publint: { strict: true },
    plugins: [
      {
        name: 'replace-version',
        transform(code) {
          if (!code.includes('__REPLACE_VERSION__')) {
            return;
          }

          // eslint-disable-next-line unicorn/no-unsafe-string-replacement
          return code.replaceAll('__REPLACE_VERSION__', pkg.version);
        },
      },
    ],
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
