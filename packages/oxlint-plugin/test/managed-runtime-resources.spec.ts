import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { describe, expect, it } from 'vite-plus/test';

describe('managedRuntime resources', () => {
  it('acquires lazily, retains resources after completed work, and releases only on disposal', async () => {
    let acquired = 0;
    let released = 0;
    const layer = Layer.effectDiscard(
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    );
    const runtime = ManagedRuntime.make(layer);

    try {
      expect([acquired, released]).toStrictEqual([0, 0]);
      const first = await runtime.runPromise(Effect.succeed('first'));

      expect([first, acquired, released]).toStrictEqual(['first', 1, 0]);
      const second = await runtime.runPromise(Effect.succeed('second'));

      expect([second, acquired, released]).toStrictEqual(['second', 1, 0]);
      await runtime.dispose();
      expect([acquired, released]).toStrictEqual([1, 1]);
    } finally {
      await runtime.dispose();
    }
  });
});
