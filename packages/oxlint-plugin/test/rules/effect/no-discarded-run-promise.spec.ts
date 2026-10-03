/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';

import { noDiscardedRunPromise } from '../../../src/rules/effect/no-discarded-run-promise';
import { testRule } from '../../rule-tester';

const ruleName = 'no-discarded-run-promise';

// The testRule helper installs shared Vitest hooks; this case also checks the reported chain span.
const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

tester.run(ruleName, noDiscardedRunPromise, {
  valid: [],
  invalid: [
    {
      filename: 'boundary.ts',
      code: "import * as Fx from 'effect/Effect';\nvoid Fx.runPromise(program)\n  .then(onSuccess)\n  .finally(cleanup)",
      // Oxlint locations use zero-based columns, spanning the runner through the final call.
      errors: [{ messageId: 'discardedChain', line: 2, column: 5, endLine: 4, endColumn: 19 }],
      output: null,
    },
  ],
});

testRule(ruleName, noDiscardedRunPromise, {
  valid: `
    import * as Fx from 'effect/Effect'
    await Fx.runPromise(program)
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.runPromise(program)
  `,
  messageId: 'discarded',
});

testRule(ruleName, noDiscardedRunPromise, {
  valid: `
    import * as Fx from 'effect/Effect'
    void Fx.runPromise(program).catch(() => 'handled')
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    void Fx.runPromise(program).then(() => 'success').finally(() => {})
  `,
  messageId: 'discardedChain',
});

const effect = `import * as Fx from 'effect/Effect';`;

for (const suffix of [
  'then(() => {}, undefined)',
  'then(() => {}, null)',
  'catch(undefined)',
  'catch(null)',
  'catch()',
]) {
  testRule(ruleName, noDiscardedRunPromise, {
    valid: `${effect} void Fx.runPromise(program).then(() => {}, () => 'handled')`,
    invalid: `${effect} void Fx.runPromise(program).${suffix}`,
    messageId: 'discardedChain',
  });
}

testRule(ruleName, noDiscardedRunPromise, {
  valid: `${effect} function f(Fx) { void Fx.runPromise(program).then(() => {}) }`,
  invalid: `${effect} void Fx.runPromise(program).then(() => {})`,
  messageId: 'discardedChain',
});

for (const invalid of [
  `${effect} void (Fx.runPromise(program) as Promise<void>).then(() => {})`,
  `${effect} void (Fx.runPromise(program).finally(() => {}) satisfies Promise<void>)`,
  `${effect} (Fx.runPromise(program).then(() => {})!, consume())`,
  `${effect} (consume(), Fx.runPromise(program).finally(() => {}))`,
  `${effect} consume((Fx.runPromise(program).then(() => {}), value))`,
]) {
  testRule(ruleName, noDiscardedRunPromise, {
    valid: `${effect} consume((value, Fx.runPromise(program).then(() => {})))`,
    invalid,
    messageId: 'discardedChain',
    output: null,
  });
}

for (const invalid of [
  `${effect} Fx.runPromise(program).then(onSuccess)`,
  `${effect} void Fx.runPromise(program).finally(cleanup)`,
  `${effect} Fx.runPromiseWith(context)(program).finally(cleanup).then(onSuccess)`,
  `import { Effect as E } from 'effect'; void E.runPromise(program).then(onSuccess)`,
  `import * as Library from 'effect'; Library.Effect.runPromise(program).finally(cleanup)`,
  `import { runPromise as run } from 'effect/Effect'; void run(program).then(onSuccess)`,
  `import { runPromiseWith as withContext } from 'effect/Effect'; withContext(context)(program).finally(cleanup)`,
  `${effect} void (<Promise<void>>Fx.runPromise(program)).then(onSuccess)`,
  `${effect} void (Fx.runPromise as typeof Fx.runPromise)(program).then(onSuccess)`,
  `${effect} void (Fx.runPromise(program).then as Function)(onSuccess)`,
  `${effect} consume(((value, Fx.runPromise(program).then(onSuccess)), other))`,
]) {
  testRule(ruleName, noDiscardedRunPromise, {
    valid: '',
    invalid,
    messageId: 'discardedChain',
    output: null,
  });
}

for (const valid of [
  `${effect} await Fx.runPromise(program).then(onSuccess)`,
  `${effect} function f() { return Fx.runPromise(program).finally(cleanup) }`,
  `${effect} const task = Fx.runPromise(program).then(onSuccess)`,
  `${effect} consume(Fx.runPromise(program).finally(cleanup))`,
  `${effect} const f = () => Fx.runPromise(program).then(onSuccess)`,
  `${effect} const f = () => (value, Fx.runPromise(program).finally(cleanup))`,
  `${effect} await (value, (Fx.runPromise(program).then(onSuccess) as Promise<void>))`,
  `${effect} void Fx.runPromise(program).finally(cleanup).catch(() => {})`,
  `${effect} void Fx.runPromise(program).then(onSuccess, function () {})`,
  `${effect} function handle() {} void Fx.runPromise(program).catch(handle).finally(cleanup)`,
  `${effect} const handle = () => {}; void Fx.runPromise(program).then(onSuccess, handle)`,
  `${effect} const handle = function () {}; void Fx.runPromise(program).catch(handle)`,
  `${effect} void Fx.runPromise(program).catch((() => {}) as Function)`,
  `${effect} void Fx.runPromise(program).catch(() => { throw new Error() })`,
  `${effect} void Fx.runPromise(program).catch(() => Promise.reject('still rejects'))`,
  `${effect} void Fx.runPromise(program).catch(handler)`,
  `${effect} void Fx.runPromise(program).then(onSuccess, handlers.onFailure)`,
  `${effect} function f(undefined) { void Fx.runPromise(program).catch(undefined) }`,
  `${effect} void Fx.runPromise(program).then(...handlers)`,
  `${effect} void Fx.runPromise(program).catch(...handlers)`,
  `${effect} void Fx.runPromise(program).finally(...handlers)`,
  `${effect} void Fx.runPromise(program)?.then(onSuccess)`,
  `${effect} void Fx.runPromise(program).then?.(onSuccess)`,
  `${effect} void Fx.runPromise(program)['then'](onSuccess)`,
  `${effect} void Fx.runPromise(program)[method](onSuccess)`,
  `${effect} void Fx['runPromise'](program).then(onSuccess)`,
  `${effect} function f(Fx) { Fx.runPromiseWith(context)(program).finally(cleanup) }`,
  `import { runPromise as run } from 'effect/Effect'; function f(run) { void run(program).then(onSuccess) }`,
  `import * as Library from 'effect'; function f(Library) { Library.Effect.runPromise(program).then(onSuccess) }`,
  `import type { Effect as Fx } from 'effect'; void Fx.runPromise(program).then(onSuccess)`,
  `${effect} void Fx.runPromiseExit(program).then(onSuccess)`,
  `${effect} void Fx.runPromiseExitWith(context)(program).finally(cleanup)`,
  `${effect} void other.runPromise(program).then(onSuccess)`,
  `${effect} void Fx.runPromise(program).other().then(onSuccess)`,
  `${effect} const run = Fx.runPromise; void run(program).then(onSuccess)`,
  `void router.isReady().then(onSuccess)`,
  `void capacitor.getLaunchUrl().then(onSuccess)`,
]) {
  testRule(ruleName, noDiscardedRunPromise, {
    valid,
    invalid: `${effect} Fx.runPromise(program).then(onSuccess)`,
    messageId: 'discardedChain',
    output: null,
  });
}

for (const invalid of [
  `${effect} void Fx.runPromise(program)`,
  `${effect} (Fx.runPromise(program), consume())`,
  `${effect} Fx.runPromiseWith(context)(program)`,
  `import { runPromise as run } from 'effect/Effect'; run(program)`,
  `import { Effect as E } from 'effect'; E.runPromise(program)`,
  `${effect} Fx['runPromise'](program)`,
]) {
  testRule(ruleName, noDiscardedRunPromise, {
    valid: `${effect} function f(Fx) { void Fx.runPromise(program) }`,
    invalid,
    messageId: 'discarded',
    output: null,
  });
}
