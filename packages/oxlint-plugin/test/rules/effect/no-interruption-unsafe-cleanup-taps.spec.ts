/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import plugin, { recommendedRules, rules } from '../../../src';
import { noInterruptionUnsafeCleanupTaps } from '../../../src/rules/effect/no-interruption-unsafe-cleanup-taps';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
const imports = `import { Effect, Deferred } from 'effect'; const deferred = Deferred.makeUnsafe();`;
const pair = `task.pipe(Effect.tap(() => cleanup), Effect.tapError(() => cleanup))`;
const sqlite = `import { Effect } from 'effect'; import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync(':memory:');`;

describe('cleanup taps registration', () => {
  it('registers the diagnostic without recommending it or offering fixes or suggestions', () => {
    expect(rules).toHaveProperty('no-interruption-unsafe-cleanup-taps', noInterruptionUnsafeCleanupTaps);
    expect(plugin).toHaveProperty(['rules', 'no-interruption-unsafe-cleanup-taps']);
    expect(recommendedRules).not.toHaveProperty('2digits/no-interruption-unsafe-cleanup-taps');
    expect(noInterruptionUnsafeCleanupTaps.meta).toMatchObject({ docs: { recommended: false } });
    expect({
      fixable: noInterruptionUnsafeCleanupTaps.meta?.fixable,
      hasSuggestions: noInterruptionUnsafeCleanupTaps.meta?.hasSuggestions,
    }).toStrictEqual({ fixable: undefined, hasSuggestions: undefined });
  });
});

tester.run('no-interruption-unsafe-cleanup-taps', noInterruptionUnsafeCleanupTaps, {
  valid: [
    `${imports} task.pipe(Effect.tap(() => Deferred.interrupt(deferred)), Effect.map(f), Effect.tapError(() => Deferred.interrupt(deferred)))`,
    `${imports} const cleanup = Deferred.interrupt(deferred);
      task.pipe(Effect.tap(() => cleanup), Effect.tapError(() => cleanup), Effect.ensuring(cleanup));`,
    ...[
      `Effect.ensuring(${pair}, cleanup)`,
      `${pair}.pipe(Effect.onExit(() => cleanup))`,
      `Effect.gen(function*() { yield* ${pair}; }).pipe(Effect.ensuring(cleanup))`,
      `Effect.ensuring(Effect.gen(function*() { yield* ${pair}; }), cleanup)`,
      `Effect.gen(function*() { yield* Effect.addFinalizer(() => cleanup); yield* ${pair}; })`,
      `Effect.gen(function*() { yield* ${pair}; yield* Effect.addFinalizer((_exit) => cleanup); })`,
      `Effect.scoped(Effect.gen(function*() { yield* Effect.acquireRelease(acquire, () => cleanup); yield* ${pair}; }))`,
      `Effect.acquireUseRelease(acquire, () => task, () => cleanup); ${pair}`,
      `Effect.gen(function*() { yield* Effect.acquireRelease(acquire, (_resource, _exit) => cleanup); yield* ${pair}; })`,
      `Effect.gen(function*() { yield* Effect.acquireUseRelease(acquire, () => task, (_resource, _exit) => cleanup); yield* ${pair}; })`,
    ].map((code) => `${imports} const cleanup = Deferred.interrupt(deferred); ${code}`),
    ...[
      // These callbacks are not outcome-independent finalizer expressions.
      `Effect.tap((value) => Deferred.interrupt(value)), Effect.tapError((error) => Deferred.interrupt(error))`,
      `Effect.tap((_value) => Deferred.interrupt(_value)), Effect.tapError(() => cleanup)`,
      `Effect.tap(async () => cleanup), Effect.tapError(() => cleanup)`,
      `Effect.tap(function*() { return cleanup }), Effect.tapError(() => cleanup)`,
      `Effect.tap((value = sideEffect()) => cleanup), Effect.tapError(() => cleanup)`,
      `Effect.tap((...args) => cleanup), Effect.tapError(() => cleanup)`,
      `Effect.tap(({}) => cleanup), Effect.tapError(() => cleanup)`,
      `Effect.tap((a, b) => cleanup), Effect.tapError(() => cleanup)`,
      `Effect.tap(function() { return arguments[0] }), Effect.tapError(() => cleanup)`,
      `Effect.tap(function() { return this.cleanup }), Effect.tapError(() => cleanup)`,
      `Effect.tap(() => { log(); return cleanup }), Effect.tapError(() => cleanup)`,
      `Effect.tap(() => cleanup), Effect.tapErrorCause(() => cleanup)`,
      `Effect.tap(() => Deferred.interrupt(deferred)), Effect.tapError(() => Deferred.interrupt(other))`,
      `Effect.tap(() => Deferred.interrupt(getDeferred())), Effect.tapError(() => Deferred.interrupt(getDeferred()))`,
      `Effect.tap(() => cleanup), ...stages, Effect.tapError(() => cleanup)`,
    ].map((stages) => `${imports} const cleanup = Deferred.interrupt(deferred); task.pipe(${stages})`),
    ...[
      `const cleanup = service.invalidateSession();`,
      `const cleanup = () => Deferred.interrupt(deferred);`,
      `const cleanup = importedCleanup;`,
      `const cleanup = flag ? Deferred.interrupt(deferred) : other;`,
      `let cleanup = Deferred.interrupt(deferred); cleanup = other;`,
      `const cleanup = Deferred.interrupt(deferred); function f(Effect) { ${pair} }`,
      `const cleanup = Deferred.interrupt(deferred); function f(Deferred) { const cleanup = Deferred.interrupt(deferred); ${pair} }`,
    ].map((code) => `${imports} ${code} ${code.includes('function f') ? '' : pair}`),
    `import type { Effect, Deferred } from 'effect'; const deferred = make(); const cleanup = Deferred.interrupt(deferred); ${pair}`,
    `import { type Effect, Deferred } from 'effect'; const deferred = make(); const cleanup = Deferred.interrupt(deferred); ${pair}`,
    `import { Effect, type Deferred } from 'effect'; const deferred = make(); const cleanup = Deferred.interrupt(deferred); ${pair}`,
    `import { Effect, Deferred } from 'effect'; import type { deferred } from './resource'; const cleanup = Deferred.interrupt(deferred); ${pair}`,
    `import { Effect } from 'effect'; import * as Deferred from 'alchemy/Deferred'; const deferred = make(); const cleanup = Deferred.interrupt(deferred); ${pair}`,
    `import { Effect } from 'other'; import { Deferred } from 'effect'; const deferred = make(); const cleanup = Deferred.interrupt(deferred); ${pair}`,
    `${imports} const cleanup = Deferred.interrupt(deferred); other.tap(() => cleanup).tapError(() => cleanup)`,
    `${imports} task.pipe(Effect.tap(() => Deferred.interrupt(deferred))); task.pipe(Effect.tapError(() => Deferred.interrupt(deferred)));`,
    `${imports} const cleanup = Deferred.interrupt(deferred); function f(deferred) { const other = Deferred.interrupt(deferred); task.pipe(Effect.tap(() => cleanup), Effect.tapError(() => other)); }`,
    `import { Effect, Scope } from 'effect'; const scope = make(); const a = exit(); const b = exit(); task.pipe(Effect.tap(() => Scope.close(scope, a)), Effect.tapCause(() => Scope.close(scope, b)))`,
    ...[
      `const cleanup = Effect.sync(() => { db.close(); log(); });`,
      `const cleanup = Effect.sync(() => { counter++; });`,
      `const cleanup = Effect.sync(() => console.log('done'));`,
      `const cleanup = Effect.sync(() => db.close(1));`,
      `const cleanup = Effect.sync(async () => db.close());`,
      `db.close = () => console.log('not cleanup'); const cleanup = Effect.sync(() => db.close());`,
      `delete db.close; const cleanup = Effect.sync(() => db.close());`,
      `const alias = db; const next = alias; next['close'] = custom; const cleanup = Effect.sync(() => db.close());`,
      `const alias = db; delete alias.close; const cleanup = Effect.sync(() => db.close());`,
      `[db.close] = [custom]; const cleanup = Effect.sync(() => db.close());`,
      `({ close: db.close } = replacement); const cleanup = Effect.sync(() => db.close());`,
      `const alias = db; ({ close: [alias.close] } = replacement); const cleanup = Effect.sync(() => db.close());`,
      `function f(db) { const cleanup = Effect.sync(() => db.close()); ${pair} }`,
      `function f(DatabaseSync) { const local = new DatabaseSync(); const cleanup = Effect.sync(() => local.close()); ${pair} }`,
    ].map((code) => `${sqlite} ${code} ${code.includes('function f') ? '' : pair}`),
    `import { Effect } from 'effect'; const db = { close() {} }; const cleanup = Effect.sync(() => db.close()); ${pair}`,
    `import { Effect } from 'effect'; import { DatabaseSync } from 'custom'; const db = new DatabaseSync(); const cleanup = Effect.sync(() => db.close()); ${pair}`,
    `import { Effect } from 'effect'; import type { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync(); const cleanup = Effect.sync(() => db.close()); ${pair}`,
  ],
  invalid: [
    {
      code: `${imports} const cleanup = Deferred.interrupt(deferred); task.pipe(Effect.tap(() => cleanup), Effect.tapError(() => cleanup))`,
      errors: [{ messageId: 'cleanup' }],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect'; import { close as finish } from 'effect/Scope'; import { Exit } from 'effect';
        const scope = makeScope(); const exit = Exit.void;
        task.pipe(Fx.tapCause((ignored) => finish(scope, exit)), Fx.tap(function(value) { return finish(/* same */ scope, exit); }))`,
      errors: [{ messageId: 'cleanup' }],
      output: null,
    },
    {
      code: `import { Effect as Fx } from 'effect'; import { DatabaseSync as DB } from 'node:sqlite';
        const db = new DB(':memory:');
        task.pipe(Fx.tap(() => Fx.sync(() => db.close())), Fx.tapError(() => Fx.sync(() => { return db.close(); })))`,
      errors: [{ messageId: 'cleanup' }],
      output: null,
    },
    ...[
      `import { Effect, Scope, Exit } from 'effect'; const scope = make(); task.pipe(Effect.tap(() => Scope.close(scope, Exit.void)), Effect.tapCause(() => Scope.close(scope, Exit.void)))`,
      `${imports} const cleanup = Deferred.interrupt(deferred); const alias = cleanup; task.pipe(Effect.tap((_unused) => alias), Effect.tapCause(() => cleanup));`,
      `import { tap as ok, tapError as err } from 'effect/Effect'; import * as D from 'effect/Deferred'; const d = make(); task.pipe(ok(() => D.interrupt(d)), err(() => { return D.interrupt(/* trivia */ d); }));`,
      `import * as Fx from 'effect'; import * as sqlite from 'node:sqlite'; const db = new sqlite.DatabaseSync(':memory:'); task.pipe(Fx.Effect.tap(() => Fx.Effect.sync(() => { db.close(); })), Fx.Effect.tapCause(() => Fx.Effect.sync(() => db.close())));`,
      `${imports} const cleanup = Deferred.interrupt(deferred); function unrelated() { return task.pipe(Effect.ensuring(cleanup)); } ${pair}`,
      `${imports} const cleanup = Deferred.interrupt(deferred); const other = Deferred.interrupt(make()); ${pair}.pipe(Effect.ensuring(other))`,
      `${imports} const cleanup = Deferred.interrupt(deferred); function f(Effect) { Effect.addFinalizer(() => cleanup); } ${pair}`,
      `${imports} const cleanup = Deferred.interrupt(deferred); Effect.acquireRelease(acquire, (resource, _exit) => Deferred.interrupt(resource)); ${pair}`,
      `${sqlite} function unrelated(db) { db.close = custom; } const cleanup = Effect.sync(() => db.close()); ${pair}`,
      `${sqlite} const { value = db.close } = source; const cleanup = Effect.sync(() => db.close()); ${pair}`,
      `${sqlite} const { [db.close]: value } = source; const cleanup = Effect.sync(() => db.close()); ${pair}`,
    ].map((code) => ({ code, errors: [{ messageId: 'cleanup', suggestions: [] }], output: null })),
  ],
});
