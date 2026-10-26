import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    dts: {
      generator: 'tsgo',
      sourcemap: true,
    },
    fixedExtension: true,
    exports: {
      devExports: 'types',
    },
    attw: {
      profile: 'esm-only',
      level: 'error',
    },
    publint: { strict: true },
    shims: true,
  },
  test: {
    include: ['test/**/*.spec.ts'],
    // Fixture tests spawn the real Oxlint binary, which loads every JS plugin.
    testTimeout: 30_000,
  },
});
