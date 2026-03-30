import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, it } from 'vite-plus/test';

import { fixtureSnapshotPath, runAutofixFixture, snapshotJson } from './helpers';
import { configPresets } from './presets';

const fixturesInputDir = fileURLToPath(new URL('../fixtures/input/', import.meta.url));
const tmpDir = fileURLToPath(new URL('../_fixtures/', import.meta.url));

beforeAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });

  return async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  };
});

describe('fixtures', () => {
  it.for(configPresets)('autofix: $name', { timeout: 30_000 }, async ({ options, name }, { expect }) => {
    const result = await runAutofixFixture({
      cwd: fileURLToPath(new URL(`../_fixtures/${name}/`, import.meta.url)),
      options,
      sourceDir: fixturesInputDir,
    });

    expect(Object.keys(result.changedFiles).length).toBeGreaterThan(0);
    await expect(snapshotJson(result)).toMatchFileSnapshot(fixtureSnapshotPath('fixtures', name));
  });
});
