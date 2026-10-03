import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { correctResults, model, staleResults } from './fixtures/struct-evolve/control';

describe('struct.evolve compiler/runtime control', () => {
  it('strictly compiles an extracted overlapping updater independently of the lint rule', () => {
    const compiler = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
    const tsconfig = fileURLToPath(new URL('fixtures/struct-evolve/tsconfig.json', import.meta.url));
    const result = spawnSync(process.execPath, [compiler, '--project', tsconfig], { encoding: 'utf8' });

    expect(`${result.stdout}${result.stderr}`).toBe('');
    expect(result.status).toBe(0);
  });

  it('ignores zipCode but updates zip in data-first, curried and pipe forms', () => {
    expect(staleResults).toStrictEqual([
      { name: 'ALICE', zip: '00000' },
      { name: 'ALICE', zip: '00000' },
      { name: 'ALICE', zip: '00000' },
    ]);
    expect(correctResults).toStrictEqual([
      { name: 'ALICE', zip: '12345' },
      { name: 'ALICE', zip: '12345' },
      { name: 'ALICE', zip: '12345' },
    ]);
    expect(model).toStrictEqual({ name: 'alice', zip: '00000' });
  });
});
