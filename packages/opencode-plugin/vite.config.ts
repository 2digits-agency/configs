import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      'vite-plus/test': 'vitest',
    },
  },
  pack: {
    entry: ['src/index.ts'],
    dts: {
      tsgo: true,
    },
    exports: {
      legacy: true,
      customExports: {
        '.': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
        './server': {
          import: {
            types: './dist/index.d.mts',
            default: './dist/index.mjs',
          },
        },
      },
    },
    attw: { profile: 'esm-only', level: 'error' },
    publint: { strict: true },
  },
  test: {
    include: ['test/**/*.spec.ts'],
    sequence: {
      concurrent: false,
    },
  },
});
