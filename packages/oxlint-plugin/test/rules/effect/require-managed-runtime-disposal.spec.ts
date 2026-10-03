import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../../../src';
import { requireManagedRuntimeDisposal } from '../../../src/rules/effect/require-managed-runtime-disposal';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

const setup = `import * as ManagedRuntime from 'effect/ManagedRuntime';
const runtime = ManagedRuntime.make(layer);`;

tester.run('require-managed-runtime-disposal', requireManagedRuntimeDisposal, {
  valid: [
    setup,
    `${setup} runtime.runPromise(program).finally(() => runtime.dispose());`,
    `${setup} runtime.runSync(program); runtime.dispose();`,
    `${setup} runtime.runPromise(program); process.on('SIGTERM', () => runtime.dispose());`,
    `${setup} runtime.runPromise(program); process.on('SIGINT', () => runtime.dispose());`,
    `${setup} runtime.runPromise(Effect.ensuring(program, runtime.disposeEffect));`,
    `${setup} runtime.runPromise(Effect.onExit(program, () => runtime.disposeEffect));`,
    `${setup} const scoped = Effect.acquireRelease(acquire, () => runtime.disposeEffect); runtime.runPromise(scoped);`,
    `${setup} runtime.runPromise(program); await runtime[Symbol.asyncDispose]();`,
    `${setup} const release = runtime.dispose; runtime.runPromise(program); onShutdown(release);`,
    `${setup} const { dispose: release } = runtime; runtime.runPromise(program); onShutdown(release);`,
    `${setup} const { disposeEffect } = runtime; runtime.runPromise(program); Effect.ensuring(program, disposeEffect);`,
    `import * as ManagedRuntime from 'effect/ManagedRuntime';
     await using runtime = ManagedRuntime.make(layer); runtime.runPromise(program);`,
    `import * as ManagedRuntime from 'effect/ManagedRuntime';
     export const runtime = ManagedRuntime.make(layer); runtime.runPromise(program);`,
    `${setup} runtime.runPromise(program); export { runtime };`,
    `${setup} runtime.runPromise(program); export default runtime;`,
    `${setup} runtime.runPromise(program); export const owner = { runtime };`,
    `${setup} runtime.runPromise(program); function getRuntime() { return runtime; }`,
    `${setup} runtime.runPromise(program); function getRuntime() { return { runtime }; }`,
    `${setup} runtime.runPromise(program); function getScope() { return runtime.scope; }`,
    `${setup} runtime.runPromise(program); registerOwner(runtime);`,
    `${setup} runtime.runPromise(program); registerScope(runtime.scope);`,
    `${setup} runtime.runPromise(program); owner.runtime = runtime;`,
    `${setup} runtime.runPromise(program); const alias = runtime;`,
    `${setup} runtime.runPromise(program); let alias = runtime; alias = other;`,
    `${setup} runtime.runPromise(program); runtime = other;`,
    `${setup} runtime.runPromise(program); const { runPromise } = runtime; unknown(runPromise);`,
    `${setup} unknown(runtime.runPromise);`,
    `import * as ManagedRuntime from 'effect/ManagedRuntime';
     let runtime = ManagedRuntime.make(layer); runtime.runPromise(program);`,
    `import * as ManagedRuntime from 'effect/ManagedRuntime';
     function factory(ManagedRuntime) { const runtime = ManagedRuntime.make(layer); runtime.runSync(program); }`,
    `import { make as create } from 'effect/ManagedRuntime';
     function factory(create) { const runtime = create(layer); runtime.runSync(program); }`,
    `import * as Fx from 'effect';
     function factory(Fx) { const runtime = Fx.ManagedRuntime.make(layer); runtime.runSync(program); }`,
    `import * as ManagedRuntime from 'other'; const runtime = ManagedRuntime.make(layer); runtime.runSync(program);`,
    `import type * as ManagedRuntime from 'effect/ManagedRuntime';
     const runtime = ManagedRuntime.make(layer); runtime.runSync(program);`,
    `import { type make } from 'effect/ManagedRuntime'; const runtime = make(layer); runtime.runSync(program);`,
    `import * as NodeRuntime from '@effect/platform-node/NodeRuntime'; NodeRuntime.runMain(program);`,
  ].map((code) => ({ code, filename: 'valid.ts' })),
  invalid: [
    `${setup} export const run = (program) => runtime.runPromise(program);`,
    `${setup} runtime.runSync(program);`,
    `${setup} runtime.runFork(program);`,
    `${setup} runtime.runPromiseExit(program);`,
    `import { ManagedRuntime as MR } from 'effect';
     function factory() { const runtime = MR.make(layer); return { run: (p) => runtime.runPromise(p) }; }`,
    `import * as Fx from 'effect'; const runtime = Fx.ManagedRuntime.make(layer); runtime.runSyncExit(program);`,
    `import { make as create } from 'effect/ManagedRuntime';
     function local() { const runtime = create(layer); runtime.runCallback(program); }`,
    `${setup} function unrelated(runtime) { runtime.dispose(); } runtime.runPromise(program);`,
    `${setup} { const runtime = other; runtime.dispose(); } runtime.runSync(program);`,
    `${setup} function work() { return runtime.runPromise(program); }`,
    `import * as MR from 'effect/ManagedRuntime'; const r = MR['make'](layer); r['runPromise'](program);`,
  ].map((code) => ({
    code,
    filename: 'invalid.ts',
    errors: [{ messageId: 'missingDisposal', type: 'CallExpression' }],
    // eslint-disable-next-line unicorn/no-null -- RuleTester uses null to require no automatic fix.
    output: null,
  })),
});

describe('managedRuntime rule policy', () => {
  it('registers the rule without enabling it automatically or offering a fix', () => {
    expect(rules['require-managed-runtime-disposal']).toBe(requireManagedRuntimeDisposal);
    expect(recommendedRules['2digits/require-managed-runtime-disposal']).toBeUndefined();
    expect(requireManagedRuntimeDisposal.meta?.docs).toMatchObject({ recommended: false });
    expect(requireManagedRuntimeDisposal.meta?.fixable).toBeUndefined();
    expect(requireManagedRuntimeDisposal.meta?.hasSuggestions).toBeUndefined();
  });
});
