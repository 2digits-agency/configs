/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noAsyncConstructorInRunSync } from '../../../src/rules/effect/no-async-constructor-in-run-sync';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

tester.run('no-async-constructor-in-run-sync', noAsyncConstructorInRunSync, {
  valid: [
    `import * as Effect from 'effect/Effect'; Effect.runSync(Effect.callback(resume => resume(Effect.succeed(42))))`,
    `import * as Effect from 'effect/Effect'; Effect.runSync(Effect.succeed(42).pipe(Effect.timeout(100)))`,
  ],
  invalid: [
    {
      code: `import * as Effect from 'effect/Effect'; Effect.runSync(Effect.promise(() => Promise.resolve(42)))`,
      errors: [
        {
          message: 'runSync cannot await this Promise-backed effect. Use an asynchronous runner and adapt the caller.',
          line: 1,
          column: 56,
          endColumn: 97,
        },
      ],
      output: null,
    },
    {
      code: `import * as Effect from 'effect/Effect'; Effect.runSync(Effect.sleep(0.5))`,
      errors: [{ messageId: 'duration', line: 1, column: 56, endColumn: 73 }],
      output: null,
    },
    {
      code: `import * as Effect from 'effect/Effect';
Effect.succeed(42).pipe(Effect.delay(1), Effect.runSync)`,
      errors: [{ messageId: 'duration', line: 2, column: 24, endColumn: 39 }],
      output: null,
    },
  ],
});

const effect = `import * as Effect from 'effect/Effect';`;

tester.run('no-async-constructor-in-run-sync pipes', noAsyncConstructorInRunSync, {
  valid: [
    `${effect} Effect.runSync(Effect.promise(f).pipe(replaceWithSync))`,
    `${effect} Effect.runSync(Effect.sleep(1).pipe(Effect.provideService(Clock.Clock, customClock)))`,
    `${effect} Effect.sleep(1).pipe(Effect.provideService(Clock.Clock, customClock), Effect.runSync)`,
    `${effect} Effect.runSync(program.pipe(Effect.delay(1)))`,
    `${effect} Effect.runSync(Effect.succeed(42).pipe(Effect.delay(0)))`,
    `${effect} Effect.succeed(42).pipe(Effect.delay(1), replaceWithSync, Effect.runSync)`,
    `${effect} Effect.runSync(Effect.promise(f).pipe(Effect.timeout(100)))`,
    ...['0', '-1', 'n', "'1 millis'", 'Infinity', '1e999', 'NaN', '1n'].flatMap((duration) => [
      `${effect} Effect.runSync(Effect.sleep(${duration}))`,
      `${effect} Effect.succeed(42).pipe(Effect.delay(${duration}), Effect.runSync)`,
    ]),
    ...[
      `Effect.runSync(Effect.async(resume => resume(Effect.succeed(42))))`,
      `Effect.runSync(Effect.try(() => 42))`,
      `Effect.runSync(program)`,
      `Effect.runSync(helper())`,
      `Effect.runSync(Effect.gen(function* () { yield* Effect.sleep(1) }))`,
      `Effect.runPromise(Effect.promise(f))`,
      `Effect.runFork(Effect.sleep(1))`,
      `Effect.runSyncWith(runtime)(Effect.promise(f))`,
      `Runtime.runSync(runtime)(Effect.promise(f))`,
      `Effect.runSync(Effect.sleep(1).pipe(Effect.provide(layer)))`,
      `Effect.runSync(Effect.sleep(1).pipe(Effect.withClock(customClock)))`,
      `Effect.runSync(Effect.sleep(1).pipe(Effect.flatMap(() => Effect.succeed(42))))`,
      `Effect.runSync(Effect.promise(f).pipe(...steps))`,
      `Effect.runSync(Effect.succeed(42).pipe(Effect.map(() => Effect.sleep(1))))`,
      `Effect.runSync(Effect.succeed(42).pipe(Effect.timeoutOption(100)))`,
      `Effect.runSync(Effect.succeed(42).pipe(Effect.timeoutOrElse({duration: 100})))`,
      `function f(Effect) { Effect.runSync(Effect.promise(g)) }`,
      `function f() { const Effect = other; Effect.runSync(Effect.sleep(1)) }`,
    ].map((source) => `${effect} ${source}`),
    `Effect.runSync(Effect.promise(f))`,
    `import { Effect } from 'unrelated'; Effect.runSync(Effect.promise(f))`,
    `import { Effect } from '@effect/platform'; Effect.runSync(Effect.promise(f))`,
    `import * as Effect from 'effect/Other/Effect'; Effect.runSync(Effect.promise(f))`,
    `import type { Effect } from 'effect'; Effect.runSync(Effect.promise(f))`,
    `import { type promise, runSync } from 'effect/Effect'; runSync(promise(f))`,
    `import Root from 'effect'; Root.Effect.runSync(Root.Effect.promise(f))`,
    `import { runSync, promise } from 'effect/Effect'; function f(promise) { runSync(promise(g)) }`,
    `import { runSync, promise } from 'effect/Effect'; function f(runSync) { runSync(promise(g)) }`,
    `import * as Root from 'effect'; function f(Root) { Root.Effect.promise(g).pipe(Root.Effect.runSync) }`,
    `${effect} function f(Effect) { (Effect as typeof Effect).runSync((Effect!).promise(g)) }`,
    `import * as Effect from 'effect/Effect'; import { map } from 'other'; Effect.runSync(Effect.promise(f).pipe(map(g)))`,
    `import * as Effect from 'effect/Effect'; import { map } from 'effect/Effect'; function f(map) { Effect.runSync(Effect.promise(g).pipe(map(h))) }`,
  ],
  invalid: [
    ...[
      `Effect.promise(f).pipe(Effect.map(x => x + 1), Effect.runSync)`,
      `Effect.runSync(Effect.tryPromise(f).pipe(Effect.as(42), Effect.asVoid))`,
      `Effect.runSync(Effect.promise(f).pipe(Effect.map(f)).pipe(Effect.as(42)))`,
    ].map((source) => ({ code: `${effect} ${source}`, errors: [{ messageId: 'promise' }], output: null })),
    ...[
      `Effect.runSync(Effect.succeed(42).pipe(Effect.delay(1)))`,
      `Effect.succeed(42).pipe(Effect.map(f), Effect.delay(0.5), Effect.asVoid, Effect.runSync)`,
      `Effect.runSync(Effect.delay(Effect.succeed(42), 1))`,
      `Effect.runSync(Effect.sleep(1).pipe(Effect.map(f)))`,
    ].map((source) => ({ code: `${effect} ${source}`, errors: [{ messageId: 'duration' }], output: null })),
    ...[
      `import { Effect as Fx } from 'effect'; Fx.runSync(Fx.tryPromise({ try: f, catch: g }))`,
      `import * as Root from 'effect'; Root.Effect.promise(f).pipe(Root.Effect.runSync)`,
      `import { promise as p, runSync as run } from 'effect/Effect'; run(p(f))`,
      `import * as Fx from 'effect/Effect'; (Fx.runSync as Runner)((Fx.promise(f) as Program)!)`,
      `import * as Fx from 'effect/Effect'; Fx.runSync((<Program>Fx.promise(f)) satisfies Program)`,
      `import * as Fx from 'effect/Effect'; Fx.runSync(Fx['promise'](f))`,
      `import * as Fx from 'effect/Effect'; (Fx as typeof Fx).runSync(Fx.promise(f))`,
      `import * as Fx from 'effect/Effect'; Fx.runSync((Fx!).promise(f))`,
      `import * as Root from 'effect'; ((Root as typeof Root).Effect!).promise(f).pipe((Root.Effect as Runner).runSync)`,
    ].map((code) => ({ code, errors: [{ messageId: 'promise' }], output: null })),
  ],
});
