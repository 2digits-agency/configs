import fs from 'node:fs/promises';
import nodePath from 'node:path';

import ts from 'dedent';
import { exec } from 'tinyexec';
import { glob } from 'tinyglobby';
import { afterAll, beforeAll, it } from 'vitest';

beforeAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true });
});

afterAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true });
});

it('should autofix', { timeout: 30_000 }, async ({ expect }) => {
  const from = nodePath.resolve('fixtures/input');
  const output = nodePath.resolve('fixtures/output');
  const cwd = nodePath.resolve('_fixtures');

  await fs.cp(from, cwd, {
    recursive: true,
    filter: (src) => !src.includes('node_modules'),
  });

  await fs.writeFile(
    nodePath.join(cwd, 'eslint.config.ts'),
    ts`
      import twoDigits from '@2digits/eslint-config';

      export default twoDigits({
        react: true,
        next: true,
        tailwind: true,
        storybook: true,
        graphql: true,
        tanstack: true,
        turbo: true,
        drizzle: true,
        ts: true,
      });
    `,
  );

  await exec('npx', ['eslint', '.', '--fix'], {
    nodeOptions: { cwd, stdio: 'pipe' },
  });

  const files = await glob('**/*', {
    ignore: ['node_modules', 'eslint.config.ts'],
    cwd,
  });

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(nodePath.join(cwd, file), 'utf8');
      const source = await fs.readFile(nodePath.join(from, file), 'utf8');
      const outputPath = nodePath.join(output, file);

      if (content === source) {
        await fs.rm(outputPath, { force: true });

        return;
      }
      await expect.soft(content).toMatchFileSnapshot(nodePath.join(output, file));
    }),
  );
});
