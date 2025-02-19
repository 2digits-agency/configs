import path from 'node:path';
import { fileURLToPath } from 'node:url';

import twoDigits from '@2digits/eslint-config';

export default twoDigits(
  {
    ignores: {
      gitIgnore: {
        cwd: path.dirname(fileURLToPath(import.meta.url)),
      },
    },
    react: true,
    next: true,
    tailwind: true,
    storybook: true,
    graphql: true,
    tanstack: true,
    turbo: true,
    drizzle: true,
    ts: true,
  },
  {
    files: ['packages/eslint-config/typings/css-tree/index.d.ts'],
    rules: {
      '@2digits/type-param-names': 'off',
      'ts/no-explicit-any': 'off',
    },
  },
);
