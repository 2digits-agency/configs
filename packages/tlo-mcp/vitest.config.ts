import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'es2020',
  },
  test: {
    include: ['test/**/*.test.ts'],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: false,
    },
  },
});
