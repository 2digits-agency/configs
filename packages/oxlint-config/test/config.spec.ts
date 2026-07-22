import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import withTwoDigits, { twoDigits } from '../src';
import { zodConfig } from '../src/configs/zod';

const fixtureDirectory = fileURLToPath(new URL('fixtures/zod', import.meta.url));
const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

describe('oxlint config', () => {
  it('preserves top-level defaults when extending the config', () => {
    const config = withTwoDigits(
      {
        rules: {
          'eslint/no-console': 'warn',
        },
      },
      {
        rules: {
          'eslint/no-console': 'off',
        },
      },
    );

    expect(config.env).toMatchObject({ browser: true, node: true });
    expect(config.ignorePatterns).toContain('**/fixtures/**');
    expect(config.rules?.['eslint/no-console']).toBe('off');
    expect(twoDigits.env).toMatchObject({ browser: true, node: true });
  });

  it('configures eslint-plugin-zod', () => {
    const plugin = zodConfig.jsPlugins.at(0);

    expect(plugin?.name).toBe('zod');
    expect(plugin?.specifier).toContain('eslint-plugin-zod');
    expect(zodConfig.rules['zod/array-style']).toStrictEqual(['error', { style: 'function' }]);
  });

  it('loads and executes eslint-plugin-zod', () => {
    const result = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', 'invalid.mjs'], {
      cwd: fixtureDirectory,
      encoding: 'utf8',
    });

    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('zod(array-style)');
  });
});
