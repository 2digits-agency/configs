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

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

const duration = `import * as Duration from 'effect/Duration';`;

tester.run('prefer-effect-duration positions', preferEffectDuration, {
  valid: [
    `import * as Schedule from 'effect/Schedule'; ${duration} Schedule.exponential(Duration.millis(100), 2);`,
    `import * as Effect from 'effect/Effect'; Effect.timeoutOrElse(program, { duration: '5 seconds', orElse });`,
    `import * as Effect from 'effect/Effect'; Effect.retry(program, { times: 3 });`,
    `import * as Effect from 'effect/Effect'; const wait = 10; Effect.sleep(wait);`,
    `import * as Effect from 'effect/Effect'; function f(Effect) { Effect.sleep(10); }`,
    `import { Stream } from 'effect'; function f(Stream) { Stream.debounce(250); }`,
    `import type { Effect } from 'effect'; Effect.sleep(10);`,
  ],
  invalid: (
    [
      [
        `import * as Effect from 'effect/Effect'; Effect.sleep(5 * 1000);`,
        `${duration}\nimport * as Effect from 'effect/Effect'; Effect.sleep(Duration.millis(5 * 1000));`,
      ],
      [
        `import * as Effect from 'effect/Effect'; Effect.sleep(-1);`,
        `${duration}\nimport * as Effect from 'effect/Effect'; Effect.sleep(Duration.millis(-1));`,
      ],
      [
        `import * as Effect from 'effect/Effect'; Effect.sleep(10 ** 3);`,
        `${duration}\nimport * as Effect from 'effect/Effect'; Effect.sleep(Duration.millis(10 ** 3));`,
      ],
      [
        `import * as Schedule from 'effect/Schedule'; Schedule.exponential(100, 2);`,
        `${duration}\nimport * as Schedule from 'effect/Schedule'; Schedule.exponential(Duration.millis(100), 2);`,
      ],
      [
        `import * as Effect from 'effect/Effect'; Effect.timeoutOrElse(program, { duration: 5000, orElse });`,
        `${duration}\nimport * as Effect from 'effect/Effect'; Effect.timeoutOrElse(program, { duration: Duration.millis(5000), orElse });`,
      ],
      [
        `import { Stream } from 'effect'; stream.pipe(Stream.debounce(250));`,
        `${duration}\nimport { Stream } from 'effect'; stream.pipe(Stream.debounce(Duration.millis(250)));`,
      ],
      [
        `import { TestClock } from 'effect/testing'; TestClock.adjust(60_000);`,
        `${duration}\nimport { TestClock } from 'effect/testing'; TestClock.adjust(Duration.millis(60_000));`,
      ],
    ] satisfies Array<[string, string]>
  ).map(([code, output]) => ({ code, errors: [{ messageId: 'effectDuration' }], output })),
});
