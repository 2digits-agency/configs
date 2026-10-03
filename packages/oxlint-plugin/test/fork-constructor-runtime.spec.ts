import * as ContextV3 from 'effect-v3/Context';
import * as EffectV3 from 'effect-v3/Effect';
import * as LayerV3 from 'effect-v3/Layer';
import type { Scope as ScopeV3 } from 'effect-v3/Scope';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

class Poller extends Context.Service<Poller, { readonly active: boolean }>()('Poller') {}
class Sibling extends Context.Service<Sibling, { readonly active: boolean }>()('Sibling') {}

describe('constructor fiber ownership runtime and version controls', () => {
  it('keeps v4 scoped startup work live beside a sibling and interrupts it on shutdown', async () => {
    let childTicks = 0;
    let scopedTicks = 0;
    let interrupted = false;
    const childLoop = Effect.forever(Effect.sleep('2 millis').pipe(Effect.andThen(Effect.sync(() => childTicks++))));
    const scopedLoop = Effect.forever(
      Effect.sleep('2 millis').pipe(Effect.andThen(Effect.sync(() => scopedTicks++))),
    ).pipe(
      Effect.onInterrupt(() =>
        Effect.sync(() => {
          interrupted = true;
        }),
      ),
    );
    const bad = Layer.effect(
      Poller,
      Effect.gen(function* () {
        yield* Effect.forkChild(childLoop);

        return { active: true };
      }),
    );
    const good = Layer.effect(
      Poller,
      Effect.gen(function* () {
        yield* Effect.forkScoped(scopedLoop);

        return { active: true };
      }),
    );
    const sibling = Layer.succeed(Sibling, { active: true });

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Layer.build(Layer.merge(bad, sibling));
          yield* Effect.sleep('30 millis');
          expect(childTicks).toBe(0);
        }),
      ),
    );

    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Layer.build(Layer.merge(good, sibling));
          yield* Effect.sleep('30 millis');
          expect(scopedTicks).toBeGreaterThan(0);
          expect(interrupted).toBeFalsy();
        }),
      ),
    );

    expect(interrupted).toBeTruthy();
    const ticksAtClose = scopedTicks;

    await Effect.runPromise(Effect.sleep('10 millis'));
    expect(scopedTicks).toBe(ticksAtClose);
  });

  it('v4 Layer.effect absorbs Scope, including Context.Service inline make', () => {
    class Inline extends Context.Service<Inline>()('Inline', {
      make: Effect.gen(function* () {
        yield* Effect.forkScoped(Effect.never);

        return {};
      }),
    }) {}
    const _layer = Layer.effect(Inline, Inline.make);

    expectTypeOf<Layer.Services<typeof _layer>>().toEqualTypeOf<never>();
  });

  it('v3 fork has no Scope requirement; forkScoped requires Layer.scoped', () => {
    class Tag extends ContextV3.Tag('Tag')<Tag, { readonly active: boolean }>() {}
    const _child = LayerV3.effect(
      Tag,
      EffectV3.gen(function* () {
        yield* EffectV3.fork(EffectV3.never);

        return { active: true };
      }),
    );
    const scopedMake = EffectV3.gen(function* () {
      yield* EffectV3.forkScoped(EffectV3.never);

      return { active: true };
    });
    const _stillRequiresScope = LayerV3.effect(Tag, scopedMake);
    const _good = LayerV3.scoped(Tag, scopedMake);

    expectTypeOf<LayerV3.Layer.Context<typeof _child>>().toEqualTypeOf<never>();
    expectTypeOf<LayerV3.Layer.Context<typeof _stillRequiresScope>>().toEqualTypeOf<ScopeV3>();
    expectTypeOf<LayerV3.Layer.Context<typeof _good>>().toEqualTypeOf<never>();
  });
});
