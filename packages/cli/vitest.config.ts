import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'es2020',
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
