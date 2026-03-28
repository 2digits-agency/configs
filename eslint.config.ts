import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { twoDigits } from '@2digits/eslint-config';

export default twoDigits(
  {
    ignores: {
      ignores: [
        '.opencode',
        'fixtures/',
        'packages/*/test/fixtures/**',
        '.changeset/*-*-*.md',
        '.claude/commands/',
        '.cursor/commands/',
        '.claude/skills/openspec-*/',
        '.opencode/command/opsx-*.md',
        '.opencode/skills/openspec-*/',
        'openspec/',
        '__snapshots__/',
        '.agents/skills/',
        'packages/*/src/types.gen.d.ts',
        '**/fixtures/**',
      ],
      gitIgnore: {
        cwd: path.dirname(fileURLToPath(import.meta.url)),
        files: ['.gitignore'],
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
    files: ['packages/cli/src/**/*.ts', 'packages/tlo-mcp/src/**/*.ts'],
    rules: {
      'unicorn/throw-new-error': 'off',
      'ts/no-misused-spread': 'off',
      '@2digits/type-param-names': 'off',
    },
  },
);
