/* oxlint-disable 2digits/no-effect-alchemy-barrel-imports, 2digits/prefer-effect-alchemy-namespace-imports -- Compare actual barrel values with module objects, including intentionally aliased imports. */
import { readFileSync } from 'node:fs';

import { ALCHEMY_DEV, AdoptPolicy, RuntimeContext } from 'alchemy';
import * as Policy from 'alchemy/AdoptPolicy';
import * as Phase from 'alchemy/Phase';
import * as RuntimeContextModule from 'alchemy/RuntimeContext';
import type * as Config from 'effect/Config';
import * as ConfigProvider from 'effect/ConfigProvider';
import * as Effect from 'effect/Effect';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../src';
import * as after from './fixtures/alchemy-barrel/after';
import * as before from './fixtures/alchemy-barrel/before';
import { testRule } from './rule-tester';

describe('alchemy beta.79 barrel fix semantics', () => {
  const fixture = new URL('fixtures/alchemy-barrel/', import.meta.url);

  testRule('no-effect-alchemy-barrel-imports', rules['no-effect-alchemy-barrel-imports'], {
    valid: readFileSync(new URL('after.ts', fixture), 'utf8'),
    invalid: readFileSync(new URL('before.ts', fixture), 'utf8'),
    output: readFileSync(new URL('after.ts', fixture), 'utf8'),
    messageId: 'barrelImport',
  });

  it('pins the Alchemy and Effect versions used by the semantic fixtures', () => {
    const alchemy: unknown = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.resolve('alchemy')), 'utf8'),
    );
    const effect: unknown = JSON.parse(readFileSync(new URL('../package.json', import.meta.resolve('effect')), 'utf8'));

    expect(alchemy).toMatchObject({ version: '2.0.0-beta.79' });
    expect(effect).toMatchObject({ version: '4.0.0-rc.115' });
    expect(recommendedRules['2digits/no-effect-alchemy-barrel-imports']).toBe('error');
  });

  it('preserves Config identity and evaluates development mode before and after fixing', () => {
    expect(before.dev).toBe(ALCHEMY_DEV);
    expect(after.dev).toBe(ALCHEMY_DEV);
    expect(ALCHEMY_DEV).toBe(Phase.ALCHEMY_DEV);
    expectTypeOf(after.dev).toExtend<Config.Config<boolean>>();
    expectTypeOf(Phase).not.toExtend<Config.Config<boolean>>();

    for (const program of [before.isDevelopment, after.isDevelopment]) {
      for (const [env, expected] of [
        [{}, false],
        [{ ALCHEMY_DEV: 'true' }, true],
      ] as const) {
        expect(
          Effect.runSync(
            Effect.provideService(program, ConfigProvider.ConfigProvider, ConfigProvider.fromEnvRecord(env)),
          ),
        ).toBe(expected);
      }
    }
  });

  it('preserves the service identifier and can yield the provided runtime after fixing', () => {
    expect(before.runtimeContext).toBe(RuntimeContextModule.RuntimeContext);
    expect(after.runtimeContext).toBe(RuntimeContext);
    expect(after.runtimeContext).not.toBe(RuntimeContextModule);
    expectTypeOf(RuntimeContextModule).not.toExtend<typeof RuntimeContext>();

    const runtime = RuntimeContext.of({
      Type: 'test',
      id: 'runtime-2687',
      env: {},
      get: () => Effect.succeed(undefined),
      set: () => Effect.succeed('stored'),
    });

    for (const program of [before.runtimeId, after.runtimeId]) {
      expect(Effect.runSync(Effect.provideService(program, RuntimeContext, runtime))).toBe('runtime-2687');
    }
  });

  it('relocates a real namespace without changing its members or behavior', () => {
    expect(AdoptPolicy.adopt).toBe(Policy.adopt);
    expect(before.adopt).toBe(after.adopt);
    for (const adopt of [before.adopt, after.adopt]) {
      for (const enabled of [false, true]) {
        const program = adopt(enabled)(Policy.AdoptPolicy).pipe(Effect.provideService(Policy.AdoptPolicy, !enabled));

        expect(Effect.runSync(program)).toBe(enabled);
      }
    }
  });

  it.for(['ALCHEMY_DEV', 'Serverless'])('cannot load the unsupported subpath alchemy/%s', async (name) => {
    const source = `alchemy/${name}`;

    await expect(import(source)).rejects.toThrow(name);
  });
});
