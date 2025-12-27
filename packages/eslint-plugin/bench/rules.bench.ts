import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Linter as ESLinter, type Linter } from 'eslint';
import { bench, describe } from 'vitest';

import plugin from '../src';

const fixturesDir = path.join(import.meta.dirname, 'fixtures');

const fixtures = {
  'if-statements': {
    code: readFileSync(path.join(fixturesDir, 'if-statements.ts'), 'utf8'),
    filename: 'test.ts',
  },
  'react-handlers': {
    code: readFileSync(path.join(fixturesDir, 'react-handlers.tsx'), 'utf8'),
    filename: 'test.tsx',
  },
  'type-params': {
    code: readFileSync(path.join(fixturesDir, 'type-params.ts'), 'utf8'),
    filename: 'test.ts',
  },
};

function createLinter(): ESLinter {
  return new ESLinter({ configType: 'flat' });
}

describe('@2digits/eslint-plugin recommended', () => {
  const linter = createLinter();
  const config = [plugin.configs.recommended] as unknown as Array<Linter.Config>;

  bench('if-statements.ts', () => {
    linter.verify(fixtures['if-statements'].code, config, fixtures['if-statements'].filename);
  });

  bench('react-handlers.tsx', () => {
    linter.verify(fixtures['react-handlers'].code, config, fixtures['react-handlers'].filename);
  });

  bench('type-params.ts', () => {
    linter.verify(fixtures['type-params'].code, config, fixtures['type-params'].filename);
  });

  bench('all fixtures combined', () => {
    for (const fixture of Object.values(fixtures)) {
      linter.verify(fixture.code, config, fixture.filename);
    }
  });
});

describe('individual rules', () => {
  const linter = createLinter();

  bench('if-curly only', () => {
    const config = [
      {
        plugins: { '@2digits': plugin },
        rules: { '@2digits/if-curly': 'error' },
      },
    ] as unknown as Array<Linter.Config>;

    linter.verify(fixtures['if-statements'].code, config, fixtures['if-statements'].filename);
  });

  bench('prefer-inline-handlers only', () => {
    const config = [
      {
        plugins: { '@2digits': plugin },
        rules: { '@2digits/prefer-inline-handlers': 'error' },
      },
    ] as unknown as Array<Linter.Config>;

    linter.verify(fixtures['react-handlers'].code, config, fixtures['react-handlers'].filename);
  });

  bench('type-param-names only', () => {
    const config = [
      {
        plugins: { '@2digits': plugin },
        rules: { '@2digits/type-param-names': 'error' },
      },
    ] as unknown as Array<Linter.Config>;

    linter.verify(fixtures['type-params'].code, config, fixtures['type-params'].filename);
  });
});
