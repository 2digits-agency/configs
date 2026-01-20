import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],

  dts: {
    tsgo: true,
  },
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esm-only', level: 'error' },
  publint: { strict: true },
});
