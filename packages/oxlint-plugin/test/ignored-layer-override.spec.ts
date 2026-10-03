import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules, type RuleName } from '../src';
import { noIgnoredLayerOverride } from '../src/rules/effect/no-ignored-layer-override';

describe('packed layer override contract', () => {
  it('exports the packed override rule without recommending it or offering recomposition fixes', () => {
    const name = 'no-ignored-layer-override' satisfies RuleName;

    expect(rules[name]).toBe(noIgnoredLayerOverride);
    expect(recommendedRules[`2digits/${name}`]).toBeUndefined();
    expect(noIgnoredLayerOverride.meta?.docs?.recommended).toBeFalsy();
    expect(noIgnoredLayerOverride.meta?.fixable).toBeUndefined();
    expect(noIgnoredLayerOverride.meta?.hasSuggestions).toBeFalsy();
  });

  it('reads production through packed provision and mock through open construction', async () => {
    const Db = Context.Service<{ readonly read: Effect.Effect<string> }>('Db');
    const Reader = Context.Service<{ readonly read: Effect.Effect<string> }>('Reader');
    const DbProd = Layer.succeed(Db, { read: Effect.succeed('production') });
    const DbMock = Layer.succeed(Db, { read: Effect.succeed('mock') });
    const ReaderCore = Layer.effect(
      Reader,
      Effect.gen(function* () {
        const db = yield* Db;

        return { read: db.read };
      }),
    );
    const ReaderPacked = ReaderCore.pipe(Layer.provide(DbProd));
    const read = Effect.gen(function* () {
      const reader = yield* Reader;

      return yield* reader.read;
    });

    await expect(Effect.runPromise(read.pipe(Effect.provide(ReaderPacked.pipe(Layer.provide(DbMock)))))).resolves.toBe(
      'production',
    );
    await expect(Effect.runPromise(read.pipe(Effect.provide(ReaderCore.pipe(Layer.provide(DbMock)))))).resolves.toBe(
      'mock',
    );
  });
});
