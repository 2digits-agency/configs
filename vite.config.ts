import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    projects: ['./packages/*/vite.config.ts'],
  },
});
