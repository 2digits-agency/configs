import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'dedent';
import { exec } from 'tinyexec';
import { glob } from 'tinyglobby';
import { beforeAll, describe, it } from 'vite-plus/test';

import { configPresets } from './presets';

const fixturesDir = fileURLToPath(new URL('../fixtures/', import.meta.url));
const fixturesInputDir = nodePath.resolve(fixturesDir, 'input');
const fixturesOutputDir = nodePath.resolve(fixturesDir, 'output');
const tmpDir = fileURLToPath(new URL('../_fixtures/', import.meta.url));

beforeAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });

  return async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  };
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

describe('fixtures', () => {
  it.concurrent.for(configPresets)(
    'autofix: $name',
    { timeout: 30_000 },
    async ({ options, name }, { expect, annotate }) => {
      const from = nodePath.resolve(fixturesInputDir);
      const output = nodePath.resolve(fixturesOutputDir, name);
      const cwd = nodePath.resolve(tmpDir, name);

      await fs.cp(from, cwd, {
        recursive: true,
        filter: (src) => !src.includes('node_modules'),
      });

      await fs.writeFile(nodePath.join(cwd, 'eslint.config.ts'), generateConfigContent(options));

      await annotate(generateConfigContent(options));

      await exec('eslint', ['.', '--fix'], {
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
    },
  );
});
