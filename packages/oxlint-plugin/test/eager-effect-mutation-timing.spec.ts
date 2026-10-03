import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import { describe, expect, it } from 'vite-plus/test';

function attempt(number: number): Effect.Effect<string, string> {
  return number <= 2 ? Effect.fail('retry') : Effect.succeed('done');
}

describe('effect 4 construction versus execution controls', () => {
  it('distinguishes never-run construction and two executions for eager, suspended and fn bodies', () => {
    const counts = { eager: 0, suspended: 0, fn: 0 };

    function eager(): Effect.Effect<void> {
      counts.eager++;

      return Effect.void;
    }
    function suspended(): Effect.Effect<void> {
      return Effect.suspend(() => {
        counts.suspended++;

        return Effect.void;
      });
    }
    const deferredFn = Effect.fn('record')(() => {
      counts.fn++;

      return Effect.void;
    });
    const operations = [eager(), suspended(), deferredFn()];

    expect(counts).toStrictEqual({ eager: 1, suspended: 0, fn: 0 });
    for (const operation of operations) {
      Effect.runSync(operation);
      Effect.runSync(operation);
    }
    expect(counts).toStrictEqual({ eager: 1, suspended: 2, fn: 2 });
  });

  it('defers fn bodies with bound self options without deferring function-valued pipeables', () => {
    const counts = { body: 0, pipeable: 0 };
    const options = { self: {} };
    const deferred = Effect.fn(options, () => {
      counts.body++;

      return Effect.void;
    });

    function body(): Effect.Effect<number> {
      return Effect.succeed(counts.pipeable);
    }
    const piped = Effect.fn(body, (operation) => {
      counts.pipeable++;

      return operation;
    });
    const deferredOperation = deferred();
    const pipedOperation = piped();

    expect(counts).toStrictEqual({ body: 0, pipeable: 1 });
    Effect.runSync(deferredOperation);
    Effect.runSync(deferredOperation);
    Effect.runSync(pipedOperation);
    Effect.runSync(pipedOperation);
    expect(counts).toStrictEqual({ body: 2, pipeable: 1 });
  });

  it('retries two failures then succeeds with one construction versus three per-attempt mutations', () => {
    const counts = { eager: 0, suspended: 0, eagerAttempts: 0, suspendedAttempts: 0 };

    function eager(): Effect.Effect<string, string> {
      counts.eager++;

      return Effect.suspend(() => {
        counts.eagerAttempts++;

        return attempt(counts.eagerAttempts);
      });
    }
    const suspended = Effect.suspend(() => {
      counts.suspended++;
      counts.suspendedAttempts++;

      return attempt(counts.suspendedAttempts);
    });
    const eagerOperation = eager();

    expect(counts).toStrictEqual({ eager: 1, suspended: 0, eagerAttempts: 0, suspendedAttempts: 0 });
    expect(Effect.runSync(Effect.retry(eagerOperation, { times: 2 }))).toBe('done');
    expect(Effect.runSync(Effect.retry(suspended, { times: 2 }))).toBe('done');
    expect(counts).toStrictEqual({ eager: 1, suspended: 3, eagerAttempts: 3, suspendedAttempts: 3 });
  });

  it('defers HttpClient.make transport mutations until request execution', async () => {
    let requests = 0;
    const client = HttpClient.make(() => {
      requests++;

      return Effect.die('transport control');
    });
    const request = client.get('https://example.com');

    expect(requests).toBe(0);
    await Effect.runPromiseExit(request);
    await Effect.runPromiseExit(request);
    expect(requests).toBe(2);
  });
});
