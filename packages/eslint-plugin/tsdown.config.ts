import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],

  dts: true,
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esmOnly', level: 'error' },
  publint: { strict: true },

  shims: true,
});
