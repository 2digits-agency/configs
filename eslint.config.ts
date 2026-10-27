import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { twoDigits } from '@2digits/eslint-config';

export default twoDigits({
  ignores: {
    ignores: [
      '.opencode',
      'packages/**',
      '.tegami/*.md',
      '.claude/commands/',
      '.cursor/commands/',
      '.claude/skills/openspec-*/',
      '.opencode/command/opsx-*.md',
      '.opencode/skills/openspec-*/',
      'openspec/',
      '__snapshots__/',
      '.agents/skills/',
    ],
    gitIgnore: {
      cwd: path.dirname(fileURLToPath(import.meta.url)),
      files: ['.gitignore'],
    },
  },
  react: true,
  next: true,
  tailwind: { cssConfigPath: './packages/eslint-config/fixtures/input/styles.css' },
  storybook: true,
  graphql: true,
  tanstackQuery: true,
  tanstackRouter: true,
  turbo: true,
  drizzle: true,
  ts: { tsconfigRootDir: import.meta.dirname },
  pnpm: true,
  css: true,
  depend: true,
  zod: true,
});
