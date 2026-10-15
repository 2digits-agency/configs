/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectDurationConstants } from '../../../src/rules/effect/prefer-effect-duration-constants';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-duration-constants';

const effect = `import * as Effect from 'effect/Effect';`;

const generic = 'a Duration constructor such as Duration.seconds';

const fiveSeconds = 'Duration.seconds(5)';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule(ruleName, preferEffectDurationConstants, {
  valid: `
    import * as Duration from 'effect/Duration'
    const TIMEOUT = Duration.seconds(30)
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const TIMEOUT_MS = 30_000
  `,
  messageId: 'durationConstant',
});

tester.run(ruleName, preferEffectDurationConstants, {
  valid: [
    // Only files that use Effect are checked.
    `const TIMEOUT_MS = 30_000;`,
    `const ONE_DAY = 24 * 60 * 60 * 1000;`,
    // Only the last word decides.
    `${effect} const RETRY_DELAY_FACTOR = 2;`,
    `${effect} const TIMEOUT_COUNT = 3;`,
    `${effect} const MAX_RETRIES = 5;`,
    `${effect} const age = 42;`,
    // \`min\` usually means minimum.
    `${effect} const PASSWORD_MIN = 8;`,
    `${effect} const RANGE_MIN = 0;`,
    // Byte sizes and other non-time arithmetic.
    `${effect} const MAX_SIZE = 1024 * 1024;`,
    `${effect} const PAGE = 2 * 1000;`,
    `${effect} const BUFFER_SIZE = 60 * 1024;`,
    `${effect} const PAGE_SIZE = 60 * 2;`,
    `${effect} const MICRO = 1000 * 1000;`,
    // Shadowed API roots are not Effect.
    `${effect} function f(Effect) { const wait = 250; Effect.sleep(wait); }`,
    `import { Stream } from 'effect'; function f(Stream) { const wait = 250; Stream.debounce(wait); }`,
    // Already typed as a Duration.
    `${effect} import * as Duration from 'effect/Duration'; const TIMEOUT_MS: Duration.Input = 5000; Effect.sleep(TIMEOUT_MS);`,
    `${effect} import { Duration } from 'effect'; const TIMEOUT_MS: Duration.Duration | number = 5000;`,
    `${effect} import type * as D from 'effect/Duration'; const TIMEOUT_MS: D.Input = 5000;`,
    `${effect} import type { Input } from 'effect/Duration'; const TIMEOUT_MS: Input = 5000;`,
    // Zero and negative sentinels.
    `${effect} const POLL_MS = 0;`,
    `${effect} const TIMEOUT_MS = -1;`,
    // Conversion factors, rates, and timestamps.
    `${effect} const MS_PER_SECOND = 1000;`,
    `${effect} const MS_PER_DAY = 24 * 60 * 60 * 1000;`,
    `${effect} const REQUESTS_PER_SECOND = 10;`,
    `${effect} const SECONDS_IN_MINUTE = 60;`,
    `${effect} const DAYS_IN_WEEK = 7;`,
    `${effect} const MS_IN_DAY = 24 * 60 * 60 * 1000;`,
    `${effect} const DAY_IN_MILLISECONDS = 86_400_000;`,
    `${effect} const MINUTE_IN_SECONDS = 60;`,
    `${effect} const CREATED_AT_MS = 1_700_000_000_000;`,
    `${effect} const EPOCH_SECONDS = 1_700_000_000;`,
    `${effect} const expiresAtMs = 1_700_000_000_000;`,
    // Not a const number.
    `${effect} let TIMEOUT_MS = 30_000;`,
    `${effect} const TIMEOUT_MS = Number(process.env.TIMEOUT_MS);`,
    `${effect} const TIMEOUT = '5 seconds';`,
    `${effect} const { TIMEOUT_MS } = config;`,
    // Numbers passed to non-duration Effect APIs.
    `${effect} const attempts = 3; Effect.retry(program, { times: attempts });`,
    `${effect} const value = 3; Effect.succeed(value);`,
  ],
  invalid: (
    [
      [`${effect} const TIMEOUT_MS = 30_000;`, 'TIMEOUT_MS', 'Duration.seconds(30)'],
      [`${effect} export const requestTimeoutMs = 1500;`, 'requestTimeoutMs', 'Duration.millis(1500)'],
      [`${effect} const CACHE_TTL_SECONDS = 3600;`, 'CACHE_TTL_SECONDS', 'Duration.hours(1)'],
      [`${effect} const ttlInMinutes = 90;`, 'ttlInMinutes', 'Duration.minutes(90)'],
      [`${effect} const wait = 10 ** 3; Effect.sleep(wait);`, 'wait', 'Duration.seconds(1)'],
      [`${effect} const wait = 5000 % 3000; Effect.sleep(wait);`, 'wait', 'Duration.seconds(2)'],
      // A local type named Duration is not Effect's.
      [`${effect} type Duration = number; const TIMEOUT_MS: Duration = 5000;`, 'TIMEOUT_MS', fiveSeconds],
      [
        `${effect} import type { Input } from 'effect/Duration'; function f() { type Input = number; const TIMEOUT_MS: Input = 5000; }`,
        'TIMEOUT_MS',
        fiveSeconds,
      ],
      [`${effect} const SESSION_WINDOW_MINUTES = 15;`, 'SESSION_WINDOW_MINUTES', 'Duration.minutes(15)'],
      [`${effect} const RETENTION_DAYS = 14;`, 'RETENTION_DAYS', 'Duration.weeks(2)'],
      [`${effect} const ONE_SECOND = 1000;`, 'ONE_SECOND', generic],
      // Sentinels and factors still count when they are passed as a duration.
      [`${effect} const NO_DELAY = 0; Effect.sleep(NO_DELAY);`, 'NO_DELAY', 'Duration.zero'],
      [`${effect} const MS_PER_SECOND = 1000; Effect.sleep(MS_PER_SECOND);`, 'MS_PER_SECOND', 'Duration.seconds(1)'],
      // Declaration order does not change the suggested unit.
      [
        `${effect} const run = () => Effect.sleep(TIMEOUT_SECONDS); const TIMEOUT_SECONDS = 5;`,
        'TIMEOUT_SECONDS',
        fiveSeconds,
      ],
      [
        `${effect} const run = () => Effect.sleep(REQUEST_TIMEOUT); const REQUEST_TIMEOUT = 30;`,
        'REQUEST_TIMEOUT',
        'Duration.millis(30)',
      ],
      [
        `${effect} const REQUEST_TIMEOUT = 30; Effect.sleep(REQUEST_TIMEOUT);`,
        'REQUEST_TIMEOUT',
        'Duration.millis(30)',
      ],
      [`${effect} const ONE_DAY = 24 * 60 * 60 * 1000;`, 'ONE_DAY', 'Duration.days(1)'],
      [`${effect} const FIVE = 5 * 60_000;`, 'FIVE', 'Duration.minutes(5)'],
      [`${effect} const ONE_DAY = 24 * 60 * 60;`, 'ONE_DAY', generic],
      [`${effect} const REQUEST_TIMEOUT = 30;`, 'REQUEST_TIMEOUT', generic],
      [`${effect} const maxAge = 3600 as const;`, 'maxAge', generic],
      [`${effect} const expiresIn = 60;`, 'expiresIn', generic],
      // Any numeric const used as a Duration.Input, whatever its name.
      [`${effect} const wait = 250; Effect.sleep(wait);`, 'wait', 'Duration.millis(250)'],
      [`${effect} const wait = 250; program.pipe(Effect.timeout(wait));`, 'wait', 'Duration.millis(250)'],
      [
        `import * as Schedule from 'effect/Schedule'; const base = 100; Schedule.exponential(base, 2);`,
        'base',
        'Duration.millis(100)',
      ],
      [
        `${effect} const limit = 5000; Effect.timeoutOrElse(program, { duration: limit, orElse });`,
        'limit',
        fiveSeconds,
      ],
      [
        `import { TestClock } from 'effect/testing'; const step = 60_000; TestClock.adjust(step);`,
        'step',
        'Duration.minutes(1)',
      ],
    ] satisfies Array<[string, string, string]>
  ).map(([code, name, replacement]) => ({
    code,
    errors: [{ messageId: 'durationConstant', data: { name, replacement } }],
    output: null,
  })),
});

tester.run(`${ruleName} reports each declaration once`, preferEffectDurationConstants, {
  valid: [],
  invalid: [
    {
      code: `${effect} const TIMEOUT_MS = 5000; Effect.sleep(TIMEOUT_MS); Effect.timeout(program, TIMEOUT_MS);`,
      errors: [{ messageId: 'durationConstant', data: { name: 'TIMEOUT_MS', replacement: fiveSeconds } }],
      output: null,
    },
  ],
});
