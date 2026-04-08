import { fileURLToPath } from 'node:url';

import { describe, it, vi } from 'vite-plus/test';

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

vi.mock('local-pkg', () => ({
  isPackageExists(name: string) {
    return detectedPackages.has(name);
  },
}));

vi.mock('pkg-types', () => ({
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
    const configNames = serialized.flatMap((entry) => (entry.name ? [entry.name] : []));

    expect(configNames).toContain('2digits:ignores');
    expect(configNames).toContain('2digits:typescript/setup');

    for (const [optionName, configName] of Object.entries(optionalConfigNames)) {
      if (isOptionEnabled(options, optionName)) {
        expect(configNames).toContain(configName);

        continue;
      }

      expect(configNames).not.toContain(configName);
    }

    await expect(snapshotJson(serialized)).toMatchFileSnapshot(fixtureSnapshotPath('factory', name));
  });
});
