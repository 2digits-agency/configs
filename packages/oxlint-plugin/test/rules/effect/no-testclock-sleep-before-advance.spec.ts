/* oxlint-disable unicorn/no-null -- Assert that the diagnostic never offers a concurrency rewrite. */
/* eslint-disable unicorn/no-null -- RuleTester uses null for no fix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../../../src';
import { testRule } from '../../rule-tester';

const imports = `
  import { it } from '@effect/vitest';
  import * as Effect from 'effect/Effect';
  import * as TestClock from 'effect/testing/TestClock';
`;

testRule('no-testclock-sleep-before-advance', rules['no-testclock-sleep-before-advance'], {
  valid: `${imports}
    it.effect('fork first', () => Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(Effect.sleep('1 second'));
      yield* TestClock.adjust('1 second');
      yield* Fiber.join(fiber);
    }));
  `,
  invalid: `${imports}
    it.effect('blocked', () => Effect.gen(function* () {
      yield* Effect.sleep('1 second');
      yield* TestClock.adjust('1 second');
    }));
  `,
  messageId: 'sleepBeforeAdvance',
  output: null,
});

describe('test clock rule registration', () => {
  it('registers the diagnostic without enabling it by default', () => {
    expect(rules['no-testclock-sleep-before-advance'].meta?.docs?.recommended).toBeFalsy();
    expect(recommendedRules['2digits/no-testclock-sleep-before-advance']).toBeUndefined();
  });
});

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

tester.run('no-testclock-sleep-before-advance', rules['no-testclock-sleep-before-advance'], {
  valid: [
    'Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); });',
    ...[
      `yield* Effect.sleep(0); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep('0 seconds'); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep('0.1 nanos'); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(0.0000001); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep('1e309 seconds'); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep('Infinity'); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(-1); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(duration); yield* TestClock.adjust(1);`,
      `yield* TestClock.adjust(1); yield* Effect.sleep(1);`,
      `yield* Effect.forkChild(Effect.sleep(1)); yield* TestClock.adjust(1);`,
      `yield* Effect.forkDaemon(TestClock.adjust(1)); yield* Effect.sleep(1); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(1); yield* TestClock.adjust(1); yield* Effect.forkChild(TestClock.adjust(1));`,
      `yield* TestClock.adjust((
        yield* Effect.forkChild(Effect.promise(() => new Promise(resolve => setTimeout(resolve, 10))).pipe(
          Effect.andThen(TestClock.adjust(1000))
        )), 0
      )); yield* Effect.sleep(1000); yield* TestClock.adjust(1000);`,
      `yield* TestClock.setTime(startClockDriver()); yield* Effect.sleep(1); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(1, Effect.runFork(TestClock.adjust(1))); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(1); if (condition) { yield* TestClock.adjust(1); }`,
      `if (condition) { yield* Effect.sleep(1); } yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(1); return; yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(1); yield* Effect.gen(function* () { yield* TestClock.adjust(1); });`,
      `const other = Effect.gen(function* () { yield* Effect.sleep(1); }); yield* TestClock.adjust(1);`,
      `yield* TestClock.withLive(Effect.sleep(1)); yield* TestClock.adjust(1);`,
      `yield* Effect.delay('1 second')(work); yield* TestClock.adjust(1);`,
      `yield* Effect.sleep(1).pipe(Effect.asVoid); yield* TestClock.adjust(1);`,
      `const Effect = other; yield* Effect.sleep(1); yield* TestClock.adjust(1);`,
      `const TestClock = other; yield* Effect.sleep(1); yield* TestClock.adjust(1);`,
    ].map((body) => `${imports} it.effect('excluded', () => Effect.gen(function* () { ${body} }));`),
    `${imports} it.live('live', () => Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); }));`,
    `${imports} it.effect('live', () => TestClock.withLive(Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); })));`,
    `${imports} it.effect('external', () => {
      Effect.runFork(TestClock.adjust(1));
      return Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); });
    });`,
    `${imports} it.effect('default driver', () => Effect.gen(function* (driver = Effect.runFork(TestClock.adjust(1))) {
      yield* Effect.sleep(1); yield* TestClock.adjust(1);
    }));`,
    // Pinned Mezaldy CatalogResumePolling.spec.ts L86–112: fork pending polling before adjusting and joining.
    `${imports} it.effect('poll deadline', () => Effect.gen(function* () {
      const fiber = yield* pollCatalogResumeTerminal(15427, Effect.never, () => Effect.never).pipe(Effect.flip, Effect.forkChild);
      yield* TestClock.adjust('40 seconds');
      const error = yield* Fiber.join(fiber);
      assert.include(error.message, 'unavailable');
    }));`,
    // Pinned BillyBird ExternalIntegrations.spec.ts L87–107: independently fork HTTP retries.
    `${imports} it.effect('http retries', () => Effect.gen(function* () {
      const fiber = yield* new RetryingHttpClient(mock.fetch).requestEffect('https://provider.test', { provider: 'test' }).pipe(Effect.forkChild);
      yield* TestClock.adjust('99 millis');
      expect(mock.calls).toHaveLength(1);
      yield* TestClock.adjust('1 millis');
      expect(mock.calls).toHaveLength(2);
      yield* TestClock.adjust('199 millis');
      expect(mock.calls).toHaveLength(2);
      yield* TestClock.adjust('1 millis');
      expect(yield* Fiber.join(fiber)).toBe(final);
    }));`,
    `${imports} function suite(it) {
      it.effect('shadowed', () => Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); }));
    }`,
    `import { it } from 'vitest'; import { Effect, TestClock } from 'effect';
      it.effect('not effect vitest', () => Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); }));`,
    `import { it } from '@effect/vitest'; import type { Effect, TestClock } from 'effect';
      it.effect('types', () => Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); }));`,
    `import { it } from '@effect/vitest'; import { Effect, TestClock } from 'constructor';
      it.effect('unrelated package', () => Effect.gen(function* () { yield* Effect.sleep(1); yield* TestClock.adjust(1); }));`,
  ],
  invalid: [
    {
      code: `${imports} it.effect('position', () => Effect.gen(function* () {
        yield* Effect.sleep(20);
        yield* TestClock.setTime(100);
      }));`,
      errors: [{ messageId: 'sleepBeforeAdvance', line: 6, column: 15, endColumn: 31 }],
      output: null,
    },
    {
      code: `import { it as check } from '@effect/vitest'; import { Effect as Fx } from 'effect';
        import { TestClock as Clock } from 'effect/testing';
        check.effect('aliases', () => Fx.gen(function* () {
          yield* Fx.sleep('0.5 seconds'); yield* Clock.adjust('1 second');
        }));`,
      errors: [{ messageId: 'sleepBeforeAdvance' }],
      output: null,
    },
    {
      code: `${imports} const test = Effect.provide(Effect.gen(function* () {
        yield* Effect.sleep(1); yield* TestClock.adjust(1);
      }), TestClock.layer());`,
      errors: [{ messageId: 'sleepBeforeAdvance' }],
      output: null,
    },
    {
      code: `import { it } from 'vitest'; import { Effect } from 'effect';
        import { TestClock } from 'effect/testing';
        it('explicit clock', () => Effect.gen(function* () {
          yield* Effect.sleep(10); yield* TestClock.adjust(10);
        }).pipe(Effect.provide(TestClock.layer())));`,
      errors: [{ messageId: 'sleepBeforeAdvance' }],
      output: null,
    },
    ...['0.5 nanos', '0.0005 micros', '1 milli', '1 minute', '1 hour', '1 day', '1 week'].map((duration) => ({
      code: `${imports} it.effect('units', () => Effect.gen(function* () {
        yield* Effect.sleep('${duration}'); yield* TestClock.adjust('1 week');
      }));`,
      errors: [{ messageId: 'sleepBeforeAdvance' }],
      output: null,
    })),
  ],
});

testRule('no-testclock-sleep-before-advance', rules['no-testclock-sleep-before-advance'], {
  valid: `${imports}
    const live = Effect.gen(function* () {
      yield* Effect.sleep(20);
      yield* TestClock.setTime(100);
    });
  `,
  invalid: `
    import { gen as sequence, sleep as pause, provide } from 'effect/Effect';
    import { TestClock as Clock } from 'effect/testing';
    const test = sequence(function* () {
      yield* pause(20);
      yield* Clock.setTime(100);
    }).pipe(provide(Clock.layer()));
  `,
  messageId: 'sleepBeforeAdvance',
  output: null,
});
