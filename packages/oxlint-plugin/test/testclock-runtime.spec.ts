import { setTimeout as realSleep } from 'node:timers/promises';

import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as TestClock from 'effect/testing/TestClock';
import { describe, expect, it } from 'vite-plus/test';

describe('test clock runtime regression', () => {
  it('leaves the direct sleep pending at virtual time zero and interrupts it for cleanup', async () => {
    let clock: TestClock.TestClock | undefined;
    let reachedAdvance = false;
    const bad = Effect.gen(function* () {
      yield* TestClock.testClockWith((value) =>
        Effect.sync(() => {
          clock = value;
        }),
      );
      yield* Effect.sleep('1 second');
      reachedAdvance = true;
      yield* TestClock.adjust('1 second');
    }).pipe(Effect.provide(TestClock.layer()));
    const fiber = Effect.runFork(bad);
    // This watchdog runs on the real Node clock, independently of TestClock.
    const watchdog = setTimeout(() => fiber.interruptUnsafe(), 2000);

    try {
      await realSleep(30);
      expect(clock?.currentTimeMillisUnsafe()).toBe(0);
      expect(reachedAdvance).toBeFalsy();
      expect(fiber.pollUnsafe()).toBeUndefined();
    } finally {
      clearTimeout(watchdog);
      await Effect.runPromise(Fiber.interrupt(fiber), { signal: AbortSignal.timeout(2000) });
    }
    expect(fiber.pollUnsafe()?._tag).toBe('Failure');
  });

  it('completes fork → adjust → join without waiting for a real second', async () => {
    const good = Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(Effect.sleep('1 second').pipe(Effect.as('joined')));

      yield* TestClock.adjust('1 second');

      return yield* Fiber.join(fiber);
    }).pipe(Effect.provide(TestClock.layer()));

    await expect(Effect.runPromise(good, { signal: AbortSignal.timeout(2000) })).resolves.toBe('joined');
  });
});
