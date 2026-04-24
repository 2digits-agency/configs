import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    sequence: {
      concurrent: false,
    },
  },
});
