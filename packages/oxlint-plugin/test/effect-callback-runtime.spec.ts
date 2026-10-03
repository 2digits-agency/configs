import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import { describe, expect, it } from 'vite-plus/test';

describe('effect callback runtime controls', () => {
  it('times out an unused completion registration and runs its interrupt cleanup', async () => {
    const events: Array<string> = [];
    // oxlint-disable-next-line 2digits/no-empty-effect-callback -- Deliberately broken runtime control.
    const blocked = Effect.callback<string>((_resume) => {
      events.push('registered');

      return Effect.sync(() => {
        events.push('cleanup');
      });
    });

    const result = await Effect.runPromise(blocked.pipe(Effect.timeoutOption('10 millis')));

    expect(result).toStrictEqual(Opt.none());
    expect(events).toStrictEqual(['registered', 'cleanup']);
  });

  it('returns the resumed value while preserving registration and resource cleanup', async () => {
    const events: Array<string> = [];
    const completed = Effect.callback<string>((resume) => {
      events.push('registered');
      queueMicrotask(() => {
        events.push('completed');
        resume(Effect.succeed('done'));
      });
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          events.push('cleanup');
        }),
      ),
    );

    const result = await Effect.runPromise(completed.pipe(Effect.timeoutOption('1 second')));

    expect(result).toStrictEqual(Opt.some('done'));
    expect(events).toStrictEqual(['registered', 'completed', 'cleanup']);
  });
});
