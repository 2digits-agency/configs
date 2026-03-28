import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    dts: {
      tsgo: true,
    },
    fixedExtension: true,
    attw: { profile: 'esm-only', level: 'error' },
    publint: { strict: true },
    format: 'esm',
    platform: 'node',
    shims: true,
    exports: true,
  },
  test: {
    include: ['test/**/*.spec.ts'],
    sequence: {
      concurrent: false,
    },
  },
});
