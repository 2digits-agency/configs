import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'bun',
  minify: true,
  dts: true,
  preferredTsconfig: 'tsconfig.build.json',
});
