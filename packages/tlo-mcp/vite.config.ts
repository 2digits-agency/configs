import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/bin.ts'],
    dts: false,
    deps: {
      alwaysBundle: [/^@opentunnel\//],
      onlyBundle: [/^@opentunnel\//],
    },
    fixedExtension: true,
    exports: false,
    publint: { strict: true },
  },
  test: {
    include: ['test/**/*.spec.ts'],
    fakeTimers: {
      toFake: undefined,
    },
    sequence: {
      concurrent: false,
    },
  },
});
