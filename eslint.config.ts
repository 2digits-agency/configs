import path from 'node:path';
import { fileURLToPath } from 'node:url';

import twoDigits from '@2digits/eslint-config';

export default twoDigits(
  {
    ignores: {
      ignores: ['.opencode', '.context'],
      gitIgnore: {
        cwd: path.dirname(fileURLToPath(import.meta.url)),
        files: ['.gitignore', '.prettierignore'],
      },
    },
    react: true,
    next: true,
    tailwind: true,
    storybook: true,
    graphql: true,
    tanstackQuery: true,
    tanstackRouter: true,
    turbo: true,
    drizzle: true,
    ts: true,
    pnpm: true,
    css: true,
    depend: true,
    zod: true,
  },
  {
    files: ['packages/cli/src/**/*.ts'],
    rules: {
      'unicorn/throw-new-error': 'off',
      'ts/no-misused-spread': 'off',
    },
  },
);
