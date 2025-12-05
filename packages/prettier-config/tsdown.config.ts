import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],

  dts: true,
  fixedExtension: true,
  attw: { profile: 'strict', level: 'error' },
  publint: { strict: true },

  format: ['esm', 'cjs'],

  shims: true,
});
