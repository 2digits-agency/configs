/* oxlint-disable 2digits/effect-promise-vs-trypromise -- Exercise the exact Promise-backed constructor from the brief. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import * as Effect115 from 'effect-rc-115/Effect';
import * as Effect117 from 'effect-rc-117/Effect';
import * as Effect from 'effect/Effect';
import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

describe('pinned Effect runSync controls', () => {
  it('strictly types each pinned version’s Promise-backed runSync result as number', () => {
    expectTypeOf(() => Effect.runSync(Effect.promise(() => Promise.resolve(42)))).returns.toEqualTypeOf<number>();
    expectTypeOf(() => Effect115.runSync(Effect115.promise(() => Promise.resolve(42)))).returns.toEqualTypeOf<number>();
    expectTypeOf(() => Effect117.runSync(Effect117.promise(() => Promise.resolve(42)))).returns.toEqualTypeOf<number>();
  });

  // Separate processes keep each version's globals and runtime types independent.
  it.for([
    ['4.0.0', 'effect'],
    ['4.0.0-rc.115', 'effect-rc-115'],
    ['4.0.0-rc.117', 'effect-rc-117'],
  ] as const)('runs independent runtime controls on Effect %s', ([_version, packageName]) => {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import assert from 'node:assert/strict';
      import * as Fx from '${packageName}/Effect';
      assert.throws(() => Fx.runSync(Fx.promise(() => Promise.resolve(42))), /AsyncFiberError/);
      assert.throws(() => Fx.runSync(Fx.tryPromise(() => Promise.resolve(42))), /AsyncFiberError/);
      assert.throws(() => Fx.runSync(Fx.sleep(1)), /AsyncFiberError/);
      assert.throws(() => Fx.runSync(Fx.succeed(42).pipe(Fx.delay(1))), /AsyncFiberError/);
      assert.throws(() => Fx.runSync(Fx.promise(() => { throw new Error('before Promise'); })), /before Promise/);
      assert.equal(await Fx.runPromise(Fx.promise(() => Promise.resolve(42))), 42);
      assert.equal(Fx.runSync(Fx.callback(resume => resume(Fx.succeed(42)))), 42);
      assert.equal(Fx.runSync(Fx.succeed(42).pipe(Fx.timeout(100))), 42);
      assert.equal(Fx.runSync(Fx.sleep(0)), undefined);
      assert.equal(Fx.runSync(Fx.succeed(42).pipe(Fx.delay(0))), 42);
      console.log('AsyncFiberError; runPromise=42; callback=42; timeout=42; zero durations synchronous');
    `,
      ],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        encoding: 'utf8',
        timeout: 10_000,
      },
    );

    expect({ status: result.status, stderr: result.stderr }).toStrictEqual({ status: 0, stderr: '' });
    expect(result.stdout).toContain(
      'AsyncFiberError; runPromise=42; callback=42; timeout=42; zero durations synchronous',
    );
  });
});
