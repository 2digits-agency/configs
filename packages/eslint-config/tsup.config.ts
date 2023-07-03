import { defineConfig } from 'tsup';

import { name } from './package.json';

export default defineConfig({
  minify: true,
  target: 'esnext',
  sourcemap: true,
  treeshake: true,
  format: ['esm', 'cjs'],
  entry: ['./src/index.ts'],
  clean: true,
  dts: true,
  shims: true,
  noExternal: ['find-up'],
  name,
});
