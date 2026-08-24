import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts', 'src/base.ts', 'src/typescript.ts'],
    dts: {
      tsgo: true,
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
  },
});
