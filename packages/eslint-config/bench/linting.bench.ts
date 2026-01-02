import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Linter } from 'eslint';
import { bench, describe } from 'vitest';

import { twoDigits } from '../src';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

const fixtures = {
  'typescript-large': {
    code: readFileSync(path.join(fixturesDir, 'typescript-large.ts'), 'utf8'),
    filename: 'test.ts',
  },
  'react-component': {
    code: readFileSync(path.join(fixturesDir, 'react-component.tsx'), 'utf8'),
    filename: 'test.tsx',
  },
  'next-page': {
    code: readFileSync(path.join(fixturesDir, 'next-page.tsx'), 'utf8'),
    filename: 'test.tsx',
  },
};

describe('eslint-config factory', () => {
  bench('twoDigits() factory call', async () => {
    await twoDigits();
  });

  bench('twoDigits({ react: true })', async () => {
    await twoDigits({ react: true });
  });

  bench('twoDigits({ react: true, next: true })', async () => {
    await twoDigits({ react: true, next: true });
  });

  bench('twoDigits({ react: true, next: true, tailwind: true })', async () => {
    await twoDigits({ react: true, next: true, tailwind: true });
  });
});

describe('linting with full config', async () => {
  const linter = new Linter({ configType: 'flat' });
  const config = await twoDigits({ react: true, next: true });

  bench('typescript-large.ts', () => {
    linter.verify(fixtures['typescript-large'].code, config, fixtures['typescript-large'].filename);
  });

  bench('react-component.tsx', () => {
    linter.verify(fixtures['react-component'].code, config, fixtures['react-component'].filename);
  });

  bench('next-page.tsx', () => {
    linter.verify(fixtures['next-page'].code, config, fixtures['next-page'].filename);
  });

  bench('all fixtures combined', () => {
    for (const fixture of Object.values(fixtures)) {
      linter.verify(fixture.code, config, fixture.filename);
    }
  });
});
