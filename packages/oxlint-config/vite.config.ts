import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts', 'src/base.ts', 'src/typescript.ts'],
    dts: {
      tsgo: true,
    },
    fixedExtension: true,
    exports: true,
    attw: { profile: 'esm-only', level: 'error' },
    publint: { strict: true },
    shims: true,
  },
  test: {
    include: ['test/**/*.spec.ts'],
  },
});
