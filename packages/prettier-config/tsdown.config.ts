import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],

  dts: true,
  fixedExtension: true,
  exports: true,

  format: ['esm', 'cjs'],

  shims: true,
});
