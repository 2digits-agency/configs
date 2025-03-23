import fs from 'node:fs/promises';
import nodePath from 'node:path';

import ts from 'dedent';
import { execa } from 'execa';
import { glob } from 'tinyglobby';
import { afterAll, beforeAll, it } from 'vitest';

beforeAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true });
});

afterAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true });
});

it('should autofix', async ({ expect }) => {
  const from = nodePath.resolve('fixtures/input');
  const output = nodePath.resolve('fixtures/output');
  const target = nodePath.resolve('_fixtures');

  await fs.cp(from, target, {
    recursive: true,
    filter: (src) => !src.includes('node_modules'),
  });

  await fs.writeFile(
    nodePath.join(target, 'eslint.config.ts'),
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

  await execa('npx', ['eslint', '.', '--fix'], {
    cwd: target,
    stdio: 'pipe',
  });

  const files = await glob('**/*', {
    ignore: ['node_modules', 'eslint.config.ts'],
    cwd: target,
  });

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(nodePath.join(target, file), 'utf8');
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
