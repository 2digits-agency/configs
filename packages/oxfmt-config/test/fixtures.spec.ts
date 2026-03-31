import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it } from 'vite-plus/test';

import { expectFormatterIdempotence, type FixtureCase, formatFixture, getSnapshotPath, snapshotJson } from './helpers';

const testDir = path.dirname(fileURLToPath(import.meta.url));

const fixtureCases: Array<FixtureCase> = [
  { name: 'typescript-basics', fileName: 'input.ts', expectation: 'match' },
  { name: 'import-order', fileName: 'input.ts', expectation: 'match' },
  { name: 'tailwind-tsx', fileName: 'input.tsx', expectation: 'match' },
  { name: 'multiline-jsx', fileName: 'input.tsx', expectation: 'match' },
  { name: 'jsdoc', fileName: 'input.ts', expectation: 'known-difference', reason: 'Oxfmt has better jsdoc support.' },
  { name: 'embedded-language', fileName: 'input.ts', expectation: 'match' },
  {
    name: 'operator-position',
    fileName: 'input.ts',
    expectation: 'known-difference',
    reason: 'Oxfmt does not support Prettier experimentalOperatorPosition=start yet.',
  },
  {
    name: 'import-attributes',
    fileName: 'input.ts',
    expectation: 'known-difference',
    reason: 'Oxfmt currently formats import attribute spacing differently.',
  },
];

async function readFixture(fixture: FixtureCase): Promise<string> {
  return fs.readFile(path.join(testDir, 'fixtures', fixture.name, fixture.fileName), 'utf8');
}

describe('formatted output snapshots', () => {
  it.for(fixtureCases)('$name', async (fixture, { expect }) => {
    const outputs = await formatFixture(await readFixture(fixture), fixture);

    await expect(snapshotJson(outputs)).toMatchFileSnapshot(getSnapshotPath(testDir, fixture.name));
  });
});

describe('idempotence', () => {
  it.for(fixtureCases)('$name', async (fixture) => {
    const outputs = await formatFixture(await readFixture(fixture), fixture);

    await expectFormatterIdempotence(outputs, fixture);
  });
});

describe('prettier parity', () => {
  it.for(fixtureCases)('$name', async (fixture, { expect }) => {
    const outputs = await formatFixture(await readFixture(fixture), fixture);

    if (fixture.expectation === 'match') {
      expect(outputs.oxfmt).toBe(outputs.prettier);

      return;
    }

    expect(fixture.reason).toBeDefined();
    expect(outputs.oxfmt).not.toBe(outputs.prettier);
  });
});
