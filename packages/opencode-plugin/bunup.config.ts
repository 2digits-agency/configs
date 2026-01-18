import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'bun',
  minify: true,
  dts: {
    tsgo: true,
  },
  preferredTsconfig: 'tsconfig.build.json',
});
