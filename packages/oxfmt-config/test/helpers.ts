import path from 'node:path';

import { format as formatOxfmt } from 'oxfmt';
import { format as formatPrettier } from 'prettier';
import { expect } from 'vite-plus/test';

import prettierConfig from '@2digits/prettier-config';

import { twoDigits } from '../src';

export interface FixtureCase {
  readonly name: string;
  readonly fileName: string;
  readonly expectation: 'match' | 'known-difference';
  readonly reason?: string;
}

interface FormatterOutputs {
  readonly prettier: string;
  readonly oxfmt: string;
}

export function getSnapshotPath(testDir: string, fixtureName: string): string {
  return path.join(testDir, '__snapshots__', 'fixtures', `${fixtureName}.snap.json`);
}

export function snapshotJson(value: unknown): string {
  return `${JSON.stringify(value, undefined, 2)}\n`;
}

export async function formatFixture(source: string, fixture: FixtureCase): Promise<FormatterOutputs> {
  const prettier = await formatPrettier(source, {
    ...prettierConfig,
    filepath: path.join(fixture.name, fixture.fileName),
  });
  const result = await formatOxfmt(path.join(fixture.name, fixture.fileName), source, twoDigits);

  expect(result.errors).toStrictEqual([]);

  return {
    prettier,
    oxfmt: result.code,
  };
}

export async function expectFormatterIdempotence(outputs: FormatterOutputs, fixture: FixtureCase): Promise<void> {
  await expect(
    formatPrettier(outputs.prettier, {
      ...prettierConfig,
      filepath: path.join(fixture.name, fixture.fileName),
    }),
  ).resolves.toBe(outputs.prettier);

  await expect(formatOxfmt(path.join(fixture.name, fixture.fileName), outputs.oxfmt, twoDigits)).resolves.toMatchObject(
    {
      code: outputs.oxfmt,
      errors: [],
    },
  );
}
