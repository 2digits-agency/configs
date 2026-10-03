import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { describe, expect, it } from 'vite-plus/test';

const Db = Context.Service<{ readonly id: number }>('layer-sharing/Db');
const First = Context.Service<number>('layer-sharing/First');
const Second = Context.Service<number>('layer-sharing/Second');

async function run(shared: boolean) {
  let acquisitions = 0;
  let releases = 0;

  function makeDb() {
    return Layer.effect(
      Db,
      Effect.acquireRelease(
        Effect.sync(() => ({ id: ++acquisitions })),
        () =>
          Effect.sync(() => {
            releases++;
          }),
      ),
    );
  }

  const first = Layer.effect(First, Db.pipe(Effect.map((db) => db.id)));
  const second = Layer.effect(Second, Db.pipe(Effect.map((db) => db.id)));
  // The shared value belongs to this invocation, never a module-global singleton.
  const dbLive = shared ? makeDb() : undefined;
  const graph = Layer.merge(Layer.provide(first, dbLive ?? makeDb()), Layer.provide(second, dbLive ?? makeDb()));
  const ids = await Effect.runPromise(
    Effect.scoped(
      Effect.flatMap(Layer.build(graph), (services) => Effect.provide(Effect.all([First, Second]), services)),
    ),
  );

  return { acquisitions, releases, ids };
}

describe('scoped layer resource sharing', () => {
  it('acquires and releases two fresh resources, but one manually shared resource inside its graph owner', async () => {
    await expect(run(false)).resolves.toStrictEqual({ acquisitions: 2, releases: 2, ids: [1, 2] });
    await expect(run(true)).resolves.toStrictEqual({ acquisitions: 1, releases: 1, ids: [1, 1] });
    // A second graph owner still acquires its own resource.
    await expect(run(true)).resolves.toStrictEqual({ acquisitions: 1, releases: 1, ids: [1, 1] });
  });
});
