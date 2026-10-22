import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, vi } from 'vitest';

import { fixtureSnapshotPath, serializeConfigs, snapshotJson, withDeterministicOptions } from './helpers';
import { factoryConfigPresets } from './presets';

const workspaceRoot = fileURLToPath(new URL('../../..', import.meta.url));

const detectedPackages = new Set(['turbo', 'typescript', 'vitest']);

const optionalConfigNames: Record<string, string> = {
  next: '2digits:next/setup',
  react: '2digits:react/setup',
  tailwind: '2digits:tailwind',
  tanstackQuery: '2digits:tanstack-query',
  tanstackRouter: '2digits:tanstack-router',
  vitest: '2digits:vitest/setup',
};

function isOptionEnabled(options: Record<string, boolean | undefined>, optionName: string): boolean {
  if (optionName === 'vitest' && options[optionName] === undefined) {
    return detectedPackages.has('vitest');
  }

  return options[optionName] === true;
}

vi.mock(import('local-pkg'), () => ({
  isPackageExists(name: string) {
    return detectedPackages.has(name);
  },
}));

vi.mock(import('pkg-types'), () => ({
  async findWorkspaceDir() {
    await Promise.resolve();

    return workspaceRoot;
  },
}));

const { twoDigits } = await import('../src');

describe('factory', () => {
  it.for(factoryConfigPresets)('preset: $name', { timeout: 30_000 }, async ({ name, options }, { expect }) => {
    const config = await twoDigits(withDeterministicOptions(options, workspaceRoot));

    const serialized = serializeConfigs(config);

    const configNames = serialized.map((entry) => entry.name).filter((name) => name !== undefined);

    expect(configNames).toContain('2digits:ignores');

    expect(configNames).toContain('2digits:typescript/setup');

    const optionalEntries = Object.entries(optionalConfigNames);

    const enabledConfigNames = optionalEntries
      .filter(([optionName]) => isOptionEnabled(options, optionName))
      .map(([, configName]) => configName);

    const disabledConfigNames = optionalEntries
      .filter(([optionName]) => !isOptionEnabled(options, optionName))
      .map(([, configName]) => configName);

    for (const configName of enabledConfigNames) {
      expect(configNames).toContain(configName);
    }

    for (const configName of disabledConfigNames) {
      expect(configNames).not.toContain(configName);
    }

    await expect(snapshotJson(serialized)).toMatchFileSnapshot(fixtureSnapshotPath('factory', name));
  });

  it('passes ts.tsconfigRootDir to the TypeScript parser', async ({ expect }) => {
    const config = await twoDigits({ ts: { tsconfigRootDir: '/project' } });

    const typescriptRules = config.find((entry) => entry.name === '2digits:typescript/rules');

    expect(typescriptRules?.languageOptions?.parserOptions).toHaveProperty('tsconfigRootDir', '/project');
  });

  it('enables pnpm rules only inside a pnpm workspace', { timeout: 30_000 }, async ({ expect, onTestFinished }) => {
    const cwd = process.cwd();

    const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eslint-config-pnpm-'));

    onTestFinished(async () => {
      process.chdir(cwd);

      await fs.rm(projectDir, { recursive: true, force: true });
    });

    process.chdir(projectDir);

    const withoutWorkspace = await twoDigits();

    await fs.writeFile('pnpm-workspace.yaml', '');

    const withWorkspace = await twoDigits();

    expect(withoutWorkspace.map((entry) => entry.name)).not.toContain('2digits:pnpm/package-json');

    expect(withWorkspace.map((entry) => entry.name)).toContain('2digits:pnpm/package-json');
  });
});
