import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { format as formatOxfmt } from 'oxfmt';
import { format as formatPrettier } from 'prettier';
import { describe, expect, it } from 'vite-plus/test';

import prettierConfig from '../../prettier-config/dist/index.mjs';
import { twoDigits } from '../src';

type Expectation = 'match' | 'known-difference';

interface FixtureCase {
  readonly name: string;
  readonly fileName: string;
  readonly expectation: Expectation;
  readonly reason?: string;
}

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

function getFixturePath(fixture: FixtureCase): string {
  return path.join(testDir, 'fixtures', fixture.name, fixture.fileName);
}

async function readFixture(fixture: FixtureCase): Promise<string> {
  return fs.readFile(getFixturePath(fixture), 'utf8');
}

async function formatFixtureWithPrettier(source: string, fixture: FixtureCase): Promise<string> {
  return formatPrettier(source, {
    ...prettierConfig,
    filepath: path.join(fixture.name, fixture.fileName),
  });
}

async function formatFixtureWithOxfmt(source: string, fixture: FixtureCase): Promise<string> {
  const result = await formatOxfmt(path.join(fixture.name, fixture.fileName), source, twoDigits);

  expect(result.errors).toStrictEqual([]);

  return result.code;
}

async function expectFormatterIdempotence(
  prettierOutput: string,
  oxfmtOutput: string,
  fixture: FixtureCase,
): Promise<void> {
  await expect(formatFixtureWithPrettier(prettierOutput, fixture)).resolves.toBe(prettierOutput);
  await expect(formatFixtureWithOxfmt(oxfmtOutput, fixture)).resolves.toBe(oxfmtOutput);
}

describe('prettier parity fixtures', () => {
  for (const fixture of fixtureCases) {
    it(fixture.name, async ({ expect }) => {
      const source = await readFixture(fixture);
      const prettierOutput = await formatFixtureWithPrettier(source, fixture);
      const oxfmtOutput = await formatFixtureWithOxfmt(source, fixture);

      await expectFormatterIdempotence(prettierOutput, oxfmtOutput, fixture);

      await expect(prettierOutput).toMatchFileSnapshot(
        path.join(testDir, '__snapshots__', 'fixtures', `${fixture.name}.prettier.snap`),
      );
      await expect(oxfmtOutput).toMatchFileSnapshot(
        path.join(testDir, '__snapshots__', 'fixtures', `${fixture.name}.oxfmt.snap`),
      );

      if (fixture.expectation === 'match') {
        expect(oxfmtOutput).toBe(prettierOutput);

        return;
      }

      expect(oxfmtOutput).not.toBe(prettierOutput);

      await expect(
        [
          `fixture: ${fixture.name}`,
          `reason: ${fixture.reason ?? 'known difference'}`,
          'status: known-difference',
        ].join('\n'),
      ).toMatchFileSnapshot(path.join(testDir, '__snapshots__', 'fixtures', `${fixture.name}.reason.snap`));
    });
  }
});
