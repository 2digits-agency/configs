import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    benchmark: {
      include: ['bench/**/*.bench.ts'],
      outputJson: 'bench-results.json',
    },
  },
});
