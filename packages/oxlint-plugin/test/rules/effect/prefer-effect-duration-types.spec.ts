import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectDurationTypes } from '../../../src/rules/effect/prefer-effect-duration-types';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-duration-types';

const effect = `import * as Effect from 'effect/Effect';`;

const schema = `import * as Schema from 'effect/Schema';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule(ruleName, preferEffectDurationTypes, {
  valid: `
    import * as Duration from 'effect/Duration'
    function poll(interval: Duration.Input) {}
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    function poll(intervalMs: number) {}
  `,
  messageId: 'durationType',
});

tester.run(ruleName, preferEffectDurationTypes, {
  valid: [
    // Only files that use Effect are checked.
    `function poll(intervalMs: number) {}`,
    `interface Options { timeoutMs: number }`,
    // Already a Duration, or not a number.
    `${effect} import * as Duration from 'effect/Duration'; function poll(intervalMs: Duration.Input) {}`,
    `${effect} function poll(intervalMs: string) {}`,
    `${effect} function poll(intervalMs) {}`,
    `${effect} function poll(intervalMs = Duration.seconds(1)) {}`,
    `${schema} const Options = Schema.Struct({ timeoutMs: Schema.DurationFromMillis });`,
    `${schema} const Options = Schema.Struct({ timeoutMs: Schema.String });`,
    // Names that do not end in a millisecond unit, and timestamps.
    `${effect} function poll(interval: number, items: number) {}`,
    `${effect} interface Job { createdAtMs: number; startMs: number; deadlineMs: number }`,
    `${schema} const Job = Schema.Struct({ expiresAtMs: Schema.Number });`,
    // Callbacks whose signature a non-Effect API dictates.
    `${effect} sdk.on('done', (elapsedMs: number) => {});`,
    `${effect} sdk.on('done', (event: { elapsedMs: number }) => {});`,
    `${effect} new Retry({ onRetry(delayMs: number) {} });`,
    // Ambient declarations describe code this file does not own.
    `${effect} declare module 'sdk' { interface Options { timeoutMs: number } }`,
    `${effect} declare global { interface Window { idleMs: number } }`,
    { code: `${effect} export interface Options { timeoutMs: number }`, filename: 'sdk.d.ts' },
    // Overloads are reported at the implementation only.
    `${effect} declare function poll(intervalMs: number): void;`,
  ],
  invalid: Arr.map(
    [
      [`${effect} function poll(intervalMs: number) {}`, 'intervalMs', 'durationType'],
      [`${effect} const poll = (intervalMs?: number) => {};`, 'intervalMs', 'durationType'],
      [`${effect} function poll(intervalMs: number | undefined) {}`, 'intervalMs', 'durationType'],
      [`${effect} function poll(intervalMs = 500) {}`, 'intervalMs', 'durationType'],
      [`${effect} function poll(intervalMs: number = 500) {}`, 'intervalMs', 'durationType'],
      [`${effect} function poll(TIMEOUT_MILLIS: number) {}`, 'TIMEOUT_MILLIS', 'durationType'],
      [`${effect} const f = Effect.fn('f')(function* (retryAfterMs: number) {});`, 'retryAfterMs', 'durationType'],
      [`${effect} class Poller { constructor(private readonly intervalMs: number) {} }`, 'intervalMs', 'durationType'],
      [`${effect} class Poller { intervalMs: number = 500; }`, 'intervalMs', 'durationType'],
      [`${effect} interface Options { readonly timeoutMs: number }`, 'timeoutMs', 'durationType'],
      [`${effect} type Options = { timeoutMs?: number | null };`, 'timeoutMs', 'durationType'],
      [`${effect} function f(options: { timeoutMs: number }) {}`, 'timeoutMs', 'durationType'],
      [`${schema} const Options = Schema.Struct({ timeoutMs: Schema.Number });`, 'timeoutMs', 'durationSchema'],
      [
        `${schema} const Options = Schema.Struct({ ttlMillis: Schema.Int.pipe(Schema.optionalKey) });`,
        'ttlMillis',
        'durationSchema',
      ],
      [
        `${schema} const Options = Schema.Struct({ ttlMs: Schema.optional(Schema.NullOr(Schema.Finite)) });`,
        'ttlMs',
        'durationSchema',
      ],
      [
        `${schema} const Options = Schema.Struct({ 'ttl_ms': Schema.Number.check(Schema.isGreaterThan(0)) });`,
        'ttl_ms',
        'durationSchema',
      ],
      [
        `import { Schema } from 'effect'; class Job extends Schema.Class<Job>('Job')({ backoffMs: Schema.Number }) {}`,
        'backoffMs',
        'durationSchema',
      ],
    ] satisfies Array<[string, string, string]>,
    ([code, name, messageId]) => ({ code, errors: [{ messageId, data: { name } }] }),
  ),
});

tester.run(`${ruleName} reports overloads once`, preferEffectDurationTypes, {
  valid: [],
  invalid: [
    {
      code: `${effect} function poll(intervalMs: number): void; function poll(intervalMs: number) {}`,
      errors: [{ messageId: 'durationType', column: 96 }],
    },
  ],
});
