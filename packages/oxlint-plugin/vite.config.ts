import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    dts: {
      generator: 'tsgo',
    },
    fixedExtension: true,
    exports: true,
    attw: { profile: 'esm-only', level: 'error' },
    publint: { strict: true },
  },
  test: {
    include: ['test/**/*.spec.ts'],
    isolate: false,
    // eslint-disable-next-line turbo/no-undeclared-env-vars -- Benchmarks run directly, outside Turbo's task cache.
    setupFiles: process.env.OXLINT_BENCH_CORPUS ? ['bench/capture.ts'] : [],
  },
});
