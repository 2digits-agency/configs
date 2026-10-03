import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { afterAll, beforeAll, describe, expect, expectTypeOf, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../src';
import type { annotated, ProfileError } from './fixtures/erased-error-annotation/contracts';
import {
  defect,
  died,
  type ignored,
  type recovered,
  type unrecovered,
} from './fixtures/erased-error-annotation/inference';

const packageDirectory = fileURLToPath(new URL('..', import.meta.url));
const fixtureDirectory = fileURLToPath(new URL('fixtures/erased-error-annotation', import.meta.url));
const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));
const buildDirectory = mkdtempSync(path.join(packageDirectory, 'node_modules/erased-error-annotation-'));

interface LintOutput {
  readonly diagnostics: Array<{
    readonly code: string;
    readonly message: string;
    readonly severity: string;
    readonly labels: Array<{ readonly span: { readonly offset: number; readonly length: number } }>;
  }>;
}

function lint(config: string, file = 'contracts.ts', expectedStatus = 0): LintOutput {
  const result = spawnSync(
    process.execPath,
    [oxlintBinary, `--config=${config}`, '--format=json', '--no-ignore', file],
    {
      cwd: fixtureDirectory,
      encoding: 'utf8',
      // Run standalone Oxlint, rather than Vite+'s `lint` config loader inherited from vp test.
      env: { ...process.env, VP_VERSION: '', ERASED_ERROR_PLUGIN: path.join(buildDirectory, 'index.mjs') },
    },
  );

  expect(result.status, `${result.stdout}${result.stderr}`).toBe(expectedStatus);

  return JSON.parse(result.stdout) as LintOutput;
}

describe('erased Effect error annotations', () => {
  beforeAll(() => {
    execFileSync('vp', ['pack', '--out-dir', buildDirectory, '--no-exports', '--no-attw', '--no-publint'], {
      cwd: packageDirectory,
      encoding: 'utf8',
    });
  }, 30_000);

  afterAll(() => {
    rmSync(buildDirectory, { recursive: true, force: true });
  });

  it('registers the contract suggestion without enabling it in recommendedRules', () => {
    expect(rules['no-erased-error-annotation'].meta).toMatchObject({
      type: 'suggestion',
      docs: { recommended: false },
    });
    expect(rules['no-erased-error-annotation'].meta?.fixable).toBeUndefined();
    expect(recommendedRules).not.toHaveProperty('2digits/no-erased-error-annotation');
  });

  it('reports only the three stale annotations through the explicitly enabled built plugin', () => {
    const output = lint('oxlint.config.mjs');
    const source = readFileSync(path.join(fixtureDirectory, 'contracts.ts'), 'utf8');

    expect(output.diagnostics).toHaveLength(3);
    for (const diagnostic of output.diagnostics) {
      expect(diagnostic).toMatchObject({ code: '2digits(no-erased-error-annotation)', severity: 'warning' });
      expect(diagnostic.message).toContain('typed error channel');
      expect(diagnostic.message).toContain('defects, not success');
      const span = diagnostic.labels[0]?.span;

      assert.ok(span);
      expect(source.slice(span.offset, span.offset + span.length)).toBe('ProfileError');
    }
  });

  it('preserves the existing default diagnostics without enabling the contract suggestion', () => {
    const output = lint('recommended.config.mjs', 'contracts.ts', 1);

    expect(output.diagnostics.map(({ code }) => code)).toStrictEqual([
      '2digits(ban-error-string)',
      '2digits(ban-error-string)',
      '2digits(ban-error-string)',
    ]);
    expect(Object.keys(recommendedRules)).toHaveLength(47);
  });

  it('clears the suggestions when the error annotations are narrowed to never', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'erased-error-annotation-'));

    try {
      const file = path.join(directory, 'narrowed.ts');

      writeFileSync(
        file,
        readFileSync(path.join(fixtureDirectory, 'contracts.ts'), 'utf8').replaceAll(', ProfileError>', ', never>'),
      );
      expect(lint('oxlint.config.mjs', file).diagnostics).toStrictEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('independently establishes concrete unrecovered errors versus erased typed errors', () => {
    expectTypeOf<Effect.Error<typeof unrecovered>>().toEqualTypeOf<ProfileError>();
    expectTypeOf<Effect.Error<typeof recovered>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Error<typeof ignored>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Error<typeof died>>().toEqualTypeOf<never>();
    expectTypeOf<Effect.Error<ReturnType<typeof annotated>>>().toEqualTypeOf<ProfileError>();
  });

  it('still fails with a defect after orDie removes typed failures', () => {
    const exit = Effect.runSyncExit(died);

    assert.ok(Exit.isFailure(exit));
    expect(exit.cause.reasons).toMatchObject([{ _tag: 'Die', defect }]);
  });
});
