import * as Arr from 'effect/Array';

import { noMillisArithmetic } from '../../../src/rules/effect/no-millis-arithmetic';
import { createRuleTester, testRule } from '../../rule-tester';

const ruleName = 'no-millis-arithmetic';

const effect = `import * as Effect from 'effect/Effect';`;

const duration = `import * as Duration from 'effect/Duration';`;

const dateTime = `import * as DateTime from 'effect/DateTime';`;

const clock = `import * as Clock from 'effect/Clock';`;

const tester = createRuleTester();

testRule(ruleName, noMillisArithmetic, {
  valid: `
    import * as Duration from 'effect/Duration'
    const total = Duration.sum(timeout, delay)
  `,
  invalid: `
    import * as Duration from 'effect/Duration'
    const total = Duration.toMillis(timeout) + Duration.toMillis(delay)
  `,
  messageId: 'millisArithmetic',
});

tester.run(ruleName, noMillisArithmetic, {
  valid: [
    // Only files that use Effect are checked.
    `function f(timeoutMs: number) { return timeoutMs * 2; }`,
    // Names that do not end in a millisecond unit.
    `${effect} function f(timeout: number, items: number) { return timeout * 2 + items; }`,
    `${effect} const MS_PER_SECOND = 1000; const x = MS_PER_SECOND * 60;`,
    // Converting at a boundary is fine; only arithmetic on the number is reported.
    `${duration} setTimeout(run, Duration.toMillis(timeout));`,
    `${duration} const ms = Duration.toMillis(timeout); fetch(url, { signal: AbortSignal.timeout(ms) });`,
    // Fields of other objects may belong to an external API.
    `${effect} const slow = response.durationMs > 1000;`,
    `${effect} const total = stats.elapsedMs + stats.queuedMs;`,
    // Destructured fields mirror someone else's shape.
    `${effect} const { durationMs } = response; const slow = durationMs > 1000;`,
    `${effect} const { elapsedMs = 0 } = response; const slow = elapsedMs > 1000;`,
    `${effect} function f({ timeoutMs }: Options) { return timeoutMs * 2; }`,
    // Callback parameters whose signature a non-Effect API dictates.
    `${effect} sdk.on('done', (elapsedMs: number) => elapsedMs > 1000);`,
    `${effect} new Retry({ onRetry: (delayMs) => delayMs * 2 });`,
    `${effect} items.filter((ageMs) => ageMs > 1000);`,
    // Presence checks and formatting.
    `${effect} function f(timeoutMs?: number) { return timeoutMs === undefined; }`,
    `${effect} function f(startedAtMs: number | null) { return startedAtMs !== null; }`,
    `${effect} function f(elapsedMs: number) { return 'took ' + elapsedMs + 'ms'; }`,
    // Shadowed Effect modules are not Effect's.
    `${duration} function f(Duration) { return Duration.toMillis(a) + 1; }`,
    `${clock} const f = Effect.gen(function* (Clock) { const now = yield* Clock.currentTimeMillis; return now + 1; });`,
    // Non-time arithmetic.
    `${effect} const total = count * 2 + offset;`,
    // \`Duration\` is not imported here.
    `${effect} const a = Duration.toMillis(timeout) + 1;`,
  ],
  invalid: Arr.map(
    [
      // Durations.
      [
        `${duration} const total = Duration.toMillis(timeout) + Duration.toMillis(delay);`,
        'Duration.toMillis(timeout)',
        'duration',
        'Duration.sum',
      ],
      [
        `${duration} const longer = Duration.toMillis(a) > Duration.toMillis(b);`,
        'Duration.toMillis(a)',
        'duration',
        'Duration.isGreaterThan',
      ],
      [
        `${duration} const same = Duration.toMillis(a) === Duration.toMillis(b);`,
        'Duration.toMillis(a)',
        'duration',
        'Duration.equals',
      ],
      [`${effect} function f(timeoutMs: number) { return timeoutMs * 2; }`, 'timeoutMs', 'duration', 'Duration.times'],
      [
        `${effect} function f(timeoutMs: number) { return timeoutMs / 1000; }`,
        'timeoutMs',
        'duration',
        'Duration.toSeconds',
      ],
      [
        `${effect} function f(budgetMs: number, usedMs: number) { return budgetMs - usedMs; }`,
        'budgetMs',
        'duration',
        'Duration.subtract',
      ],
      [`${effect} const TTL_MS = 5000; const slow = elapsed > TTL_MS;`, 'TTL_MS', 'duration', 'Duration.isGreaterThan'],
      [
        `${effect} function f(waitMillis: number) { return waitMillis <= 0; }`,
        'waitMillis',
        'duration',
        'Duration.isPositive, Duration.isNegative or Duration.isZero',
      ],
      [
        `${effect} function f(waitMillis: number) { return waitMillis === 0; }`,
        'waitMillis',
        'duration',
        'Duration.isZero',
      ],
      // A const that holds a conversion is traced.
      [`${duration} const ms = Duration.toMillis(timeout); const half = ms / 2;`, 'ms', 'duration', 'Duration.divide'],
      [
        `${duration} const limit = Duration.toMillis(timeout); const slow = elapsed >= limit;`,
        'limit',
        'duration',
        'Duration.isGreaterThanOrEqualTo',
      ],
      // A class's own fields are internal.
      [
        `${effect} class Poller { pollMs = 500; next() { return this.pollMs * 2; } }`,
        'this.pollMs',
        'duration',
        'Duration.times',
      ],
      // Instants.
      [
        `${dateTime} const later = DateTime.toEpochMillis(now) + 60_000;`,
        'DateTime.toEpochMillis(now)',
        'instant',
        'DateTime.addDuration',
      ],
      [
        `${dateTime} const gap = DateTime.toEpochMillis(end) - DateTime.toEpochMillis(start);`,
        'DateTime.toEpochMillis(end)',
        'instant',
        'DateTime.distance',
      ],
      [
        `${dateTime} const expired = DateTime.toEpochMillis(now) > expiresAtMs;`,
        'DateTime.toEpochMillis(now)',
        'instant',
        'DateTime.isGreaterThan',
      ],
      [
        `${effect} function f(startedAtMs: number) { return Date.now() - startedAtMs; }`,
        'startedAtMs',
        'instant',
        'DateTime.distance',
      ],
      [
        `${effect} function f(deadlineMs: number, graceMs: number) { return deadlineMs - graceMs; }`,
        'deadlineMs',
        'instant',
        'DateTime.subtractDuration',
      ],
      [
        `${effect} function f(a: number, createdMs: number) { return createdMs === a; }`,
        'createdMs',
        'instant',
        'DateTime.Equivalence',
      ],
      [
        `${clock} ${effect} const f = Effect.gen(function* () { const now = yield* Clock.currentTimeMillis; return now + ttl; });`,
        'now',
        'instant',
        'DateTime.addDuration',
      ],
      [
        `import { Clock, Effect } from 'effect'; const f = Effect.gen(function* () { const start = yield* Clock.currentTimeMillis; const end = yield* Clock.currentTimeMillis; return end - start; });`,
        'end',
        'instant',
        'DateTime.distance',
      ],
      // Effect callbacks and internal functions are not foreign.
      [
        `${effect} const f = Effect.fn('f')(function* (timeoutMs: number) { return timeoutMs * 2; });`,
        'timeoutMs',
        'duration',
        'Duration.times',
      ],
      // A chain is reported once, at its outermost operator.
      [
        `${duration} const over = Duration.toMillis(a) + Duration.toMillis(b) > limitMs;`,
        'Duration.toMillis(a) + Duration.toMillis(b)',
        'duration',
        'Duration.isGreaterThan',
      ],
      [
        `${dateTime} const expired = Date.now() - DateTime.toEpochMillis(start) > ttlMs;`,
        'Date.now() - DateTime.toEpochMillis(start)',
        'duration',
        'Duration.isGreaterThan',
      ],
    ] satisfies Array<[string, string, 'duration' | 'instant', string]>,
    ([code, operand, kind, suggestion]) => ({
      code,
      errors: [
        {
          messageId: 'millisArithmetic',
          data: {
            operand,
            what: kind === 'duration' ? 'a duration' : 'a timestamp',
            module: kind === 'duration' ? 'Duration' : 'DateTime',
            suggestion,
          },
        },
      ],
    }),
  ),
});
