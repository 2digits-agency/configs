import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts', 'src/base.ts', 'src/typescript.ts'],
    dts: {
      generator: 'tsgo',
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
  },
  test: {
    include: ['test/**/*.spec.ts'],
  },
});
