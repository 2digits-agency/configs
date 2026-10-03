import { DatabaseSync } from 'node:sqlite';

import * as Deferred from 'effect/Deferred';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Fiber from 'effect/Fiber';
import * as Match from 'effect/Match';
import { describe, expect, it } from 'vite-plus/test';

type Outcome = 'success' | 'failure' | 'defect' | 'interruption';
type Mode = 'tapError' | 'tapCause' | 'ensuring' | 'interruptible' | 'duplicate';

async function observeCleanup(mode: Mode, outcome: Outcome, asynchronous = false) {
  const db = new DatabaseSync(':memory:');
  let count = 0;
  let closed = false;

  try {
    const exit = await Effect.runPromise(
      Effect.gen(function* () {
        const started = yield* Deferred.make<undefined>();
        const close = Effect.sync(() => {
          count++;
          db.close();
        });
        const cleanup = asynchronous ? Effect.sleep('20 millis').pipe(Effect.andThen(close)) : close;
        const operation =
          outcome === 'success'
            ? Effect.void
            : outcome === 'failure'
              ? Effect.fail('typed failure')
              : outcome === 'defect'
                ? Effect.die('defect')
                : Effect.never;
        const base = Deferred.succeed(started, undefined).pipe(Effect.andThen(operation));
        const task = Match.value(mode).pipe(
          Match.when('tapError', () =>
            base.pipe(
              Effect.tap(() => cleanup),
              Effect.tapError(() => cleanup),
            ),
          ),
          Match.when('tapCause', () =>
            base.pipe(
              Effect.tap(() => cleanup),
              Effect.tapCause(() => cleanup),
            ),
          ),
          Match.when('interruptible', () => base.pipe(Effect.ensuring(Effect.interruptible(cleanup)))),
          Match.when('duplicate', () =>
            base.pipe(
              Effect.tap(() => cleanup),
              Effect.tapError(() => cleanup),
              Effect.ensuring(cleanup),
            ),
          ),
          Match.when('ensuring', () => base.pipe(Effect.ensuring(cleanup))),
          Match.exhaustive,
        );
        const fiber = yield* Effect.forkChild(task);

        yield* Deferred.await(started);
        if (outcome === 'interruption') {
          yield* Fiber.interrupt(fiber);
        }

        return yield* Fiber.await(fiber);
      }),
    );

    try {
      db.exec('SELECT 1');
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'ERR_INVALID_STATE') {
        throw error;
      }
      closed = true;
    }

    return { count, closed, succeeded: Exit.isSuccess(exit) };
  } finally {
    if (!closed) {
      db.close();
    }
  }
}

describe('manual all-exit cleanup with Effect 4 and real SQLite handles', () => {
  it.for<Outcome>(['success', 'failure', 'defect', 'interruption'])(
    'ensuring closes exactly once after %s',
    async (outcome) => {
      await expect(observeCleanup('ensuring', outcome)).resolves.toStrictEqual({
        count: 1,
        closed: true,
        succeeded: outcome === 'success',
      });
    },
  );

  it.for([
    ['tapError', 'success', 1],
    ['tapError', 'failure', 1],
    ['tapError', 'defect', 0],
    ['tapError', 'interruption', 0],
    ['tapCause', 'success', 1],
    ['tapCause', 'failure', 1],
    ['tapCause', 'defect', 1],
    ['tapCause', 'interruption', 0],
  ] as const)('%s cleanup count after %s is %i', async ([mode, outcome, count]) => {
    await expect(observeCleanup(mode, outcome)).resolves.toStrictEqual({
      count,
      closed: count === 1,
      succeeded: outcome === 'success',
    });
  });

  it('waits for asynchronous ensuring cleanup after cancellation, unlike taps or interruptible finalization', async () => {
    await expect(observeCleanup('ensuring', 'interruption', true)).resolves.toStrictEqual({
      count: 1,
      closed: true,
      succeeded: false,
    });
    await expect(observeCleanup('tapError', 'interruption', true)).resolves.toStrictEqual({
      count: 0,
      closed: false,
      succeeded: false,
    });
    await expect(observeCleanup('tapCause', 'interruption', true)).resolves.toStrictEqual({
      count: 0,
      closed: false,
      succeeded: false,
    });
    await expect(observeCleanup('interruptible', 'interruption', true)).resolves.toStrictEqual({
      count: 0,
      closed: false,
      succeeded: false,
    });
  });

  it('demonstrates why appending ensuring instead of replacing taps double-closes the database', async () => {
    await expect(observeCleanup('duplicate', 'success')).resolves.toStrictEqual({
      count: 2,
      closed: true,
      succeeded: false,
    });
  });
});
