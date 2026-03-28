import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'dedent';
import { exec } from 'tinyexec';
import { glob } from 'tinyglobby';
import { afterAll, beforeAll, describe, it } from 'vite-plus/test';

interface ConfigPreset {
  name: string;
  options: Record<string, boolean | undefined>;
}

const CONFIG_PRESETS = [
  {
    name: 'full',
    options: {
      css: true,
      depend: true,
      drizzle: true,
      graphql: true,
      next: true,
      pnpm: false,
      react: true,
      storybook: true,
      tailwind: true,
      tanstackQuery: false,
      tanstackRouter: false,
      ts: true,
      turbo: true,
      zod: true,
    },
  },
  {
    name: 'minimal',
    options: {
      css: false,
      depend: false,
      drizzle: false,
      graphql: false,
      next: false,
      pnpm: false,
      react: false,
      storybook: false,
      tailwind: false,
      tanstackQuery: false,
      tanstackRouter: false,
      ts: true,
      turbo: false,
      zod: false,
    },
  },
  {
    name: 'react-only',
    options: {
      css: false,
      depend: true,
      drizzle: false,
      graphql: false,
      next: false,
      pnpm: false,
      react: true,
      storybook: false,
      tailwind: false,
      tanstackQuery: false,
      tanstackRouter: false,
      ts: true,
      turbo: false,
      zod: false,
    },
  },
  {
    name: 'next-stack',
    options: {
      css: false,
      depend: true,
      drizzle: false,
      graphql: false,
      next: true,
      pnpm: false,
      react: true,
      storybook: false,
      tailwind: true,
      tanstackQuery: true,
      tanstackRouter: false,
      ts: true,
      turbo: false,
      zod: false,
    },
  },
] as const satisfies ReadonlyArray<ConfigPreset>;

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));
const fixturesInputDir = nodePath.resolve(fixturesDir, 'input');
const fixturesOutputDir = nodePath.resolve(fixturesDir, 'output');
const tmpDir = fileURLToPath(new URL('../_fixtures/', import.meta.url));

console.log({
  fixturesDir,
  fixturesInputDir,
  fixturesOutputDir,
  tmpDir,
});

beforeAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function generateConfigContent(options: Record<string, boolean | undefined>): string {
  const optionsStr = Object.entries(options)
    .map(([key, value]) => `  ${key}: ${value},`)
    .join('\n');

  return ts`
    import { twoDigits } from '@2digits/eslint-config';

    export default twoDigits({
      ignores: {
        gitIgnore: {
          cwd: '.',
        },
      },
    ${optionsStr}
    });
  `;
}

describe('fixtures', ({ describe }) => {
  describe.concurrent.for(CONFIG_PRESETS)('autofix: $name', { timeout: 30_000 }, ({ options, name }) => {
    it('should match snapshot', async ({ expect, annotate }) => {
      const from = nodePath.resolve(fixturesInputDir);
      const output = nodePath.resolve(fixturesOutputDir, name);
      const cwd = nodePath.resolve(tmpDir, name);

      await fs.cp(from, cwd, {
        recursive: true,
        filter: (src) => !src.includes('node_modules'),
      });

      await fs.writeFile(nodePath.join(cwd, 'eslint.config.ts'), generateConfigContent(options));

      await annotate(generateConfigContent(options));

      await exec('npx', ['eslint', cwd, '--fix'], {
        nodeOptions: { cwd, stdio: 'pipe' },
        throwOnError: true,
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

          await expect.soft(content).toMatchFileSnapshot(outputPath);
        }),
      );
    });
  });
});
