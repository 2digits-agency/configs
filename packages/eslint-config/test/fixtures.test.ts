import fs from 'node:fs/promises';
import nodePath from 'node:path';

import ts from 'dedent';
import { exec } from 'tinyexec';
import { glob } from 'tinyglobby';
import { afterAll, beforeAll, describe, it, type ExpectStatic } from 'vitest';

interface ConfigPreset {
  name: string;
  options: Record<string, boolean | undefined>;
}

const CONFIG_PRESETS: Array<ConfigPreset> = [
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
];

beforeAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true });
});

afterAll(async () => {
  await fs.rm('_fixtures', { recursive: true, force: true });
});

function generateConfigContent(options: Record<string, boolean | undefined>): string {
  const optionsStr = Object.entries(options)
    .map(([key, value]) => `  ${key}: ${value},`)
    .join('\n');

  return ts`
    import twoDigits from '@2digits/eslint-config';

    export default twoDigits({
    ${optionsStr}
    });
  `;
}

async function runFixtureTest(preset: ConfigPreset, expect: ExpectStatic): Promise<void> {
  const from = nodePath.resolve('fixtures/input');
  const output = nodePath.resolve(`fixtures/output/${preset.name}`);
  const cwd = nodePath.resolve(`_fixtures/${preset.name}`);

  await fs.cp(from, cwd, {
    recursive: true,
    filter: (src) => !src.includes('node_modules'),
  });

  await fs.writeFile(nodePath.join(cwd, 'eslint.config.ts'), generateConfigContent(preset.options));

  await exec('npx', ['eslint', '.', '--fix'], {
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
}

describe('fixtures', () => {
  for (const preset of CONFIG_PRESETS) {
    it.concurrent(`autofix: ${preset.name}`, { timeout: 30_000 }, async ({ expect }) => {
      await runFixtureTest(preset, expect);
    });
  }
});
