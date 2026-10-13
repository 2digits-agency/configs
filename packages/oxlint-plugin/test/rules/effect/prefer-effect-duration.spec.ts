/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectDuration } from '../../../src/rules/effect/prefer-effect-duration';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-duration', preferEffectDuration, {
  valid: `
    import * as Duration from 'effect/Duration'
    import * as Effect from 'effect/Effect'
    Effect.sleep(Duration.seconds(5))
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    Effect.sleep(5000)
  `,
  messageId: 'effectDuration',
  output: `
    import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect'
    Effect.sleep(Duration.millis(5000))
  `,
});

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const effectImport = `import * as Effect from 'effect/Effect';`;

tester.run('prefer-effect-duration constants', preferEffectDuration, {
  valid: [
    // Already a Duration, or annotated as one.
    `${effectImport} import * as Duration from 'effect/Duration'; const TIMEOUT_MS = Duration.seconds(5);`,
    `${effectImport} import type * as Duration from 'effect/Duration'; const TIMEOUT_MS: Duration.Duration = 5000;`,
    `${effectImport} const TIMEOUT_MS: Duration.Input = 5000;`,
    // No Effect import: this package does not recommend Duration there.
    `const TIMEOUT_MS = 5000;`,
    // No duration signal in the name.
    `${effectImport} const MAX_RETRIES = 3;`,
    `${effectImport} const PORT = 3000;`,
    `${effectImport} const TIMEOUT_COUNT = 3;`,
    // Mutable bindings and aliases can be replaced by numbers later; the aliased declaration is reported instead.
    `${effectImport} let timeoutMs = 5000;`,
    `${effectImport} const TIMEOUT_MS = OTHER_TIMEOUT;`,
    `${effectImport} const TIMEOUT_MS = computeTimeout();`,
    `${effectImport} const timeout = { ms: 5000 };`,
    `${effectImport} const timeoutDelay = [5000];`,
    // Zero is a sentinel for "no timeout", not an ambiguous amount.
    `${effectImport} const TIMEOUT_MS = 0;`,
    `${effectImport} const TIMEOUT_MS = -1;`,
    `${effectImport} export function configure(timeoutMs = 5000) { return timeoutMs; }`,
  ],
  invalid: [
    `${effectImport} const TIMEOUT_MS = 5000;`,
    `${effectImport} const SESSION_WINDOW_MINUTES = 15;`,
    `${effectImport} export const SESSION_TIMEOUT_SECONDS = 30;`,
    `${effectImport} const retryDelay = 250;`,
    `${effectImport} const debounceIntervalMs = 30 * 1000;`,
    `${effectImport} const BACKOFF_MS = BASE_MS * 2;`,
    `${effectImport} const timeToLive = 60_000;`,
    `${effectImport} const ttlSeconds = 45;`,
    `${effectImport} const THIRTY_SECONDS_MS = 30_000;`,
    `${effectImport} const FIVE_MINUTES_MS = 300_000;`,
  ].map((code) => ({
    code,
    filename: 'invalid.ts',
    errors: [{ messageId: 'effectDurationConstant' }],
    output: null,
  })),
});

tester.run('prefer-effect-duration constant units', preferEffectDuration, {
  valid: [],
  invalid: [
    { name: 'TIMEOUT_MS', constructor: 'millis', code: `${effectImport} const TIMEOUT_MS = 5000;` },
    { name: 'timeoutInSeconds', constructor: 'seconds', code: `${effectImport} const timeoutInSeconds = 30;` },
    {
      name: 'SESSION_TIMEOUT_MINUTES',
      constructor: 'minutes',
      code: `${effectImport} const SESSION_TIMEOUT_MINUTES = 15;`,
    },
    { name: 'RETRY_BACKOFF', constructor: 'millis', code: `${effectImport} const RETRY_BACKOFF = 250;` },
    { name: 'FIVE_MINUTES_MS', constructor: 'millis', code: `${effectImport} const FIVE_MINUTES_MS = 300_000;` },
  ].map(({ code, name, constructor }) => ({
    code,
    filename: 'invalid.ts',
    errors: [{ messageId: 'effectDurationConstant', data: { name, constructor } }],
    output: null,
  })),
});
