/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert no autofix. */
import * as Effect from 'effect/Effect';
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it, vi } from 'vite-plus/test';

import { noThrowInEffectCallback } from '../../../src/rules/effect/no-throw-in-effect-callback';
import { testRule } from '../../rule-tester';

testRule('no-throw-in-effect-callback', noThrowInEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.flatMap((value) => value < 0 ? Fx.fail(new Error()) : Fx.succeed(value)))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.map((value) => { if (value < 0) throw new Error(); return value }))
  `,
  messageId: 'callbackThrow',
});

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const effect = `import * as Effect from 'effect/Effect';`;

tester.run('no-throw-in-effect-callback JSON.parse', noThrowInEffectCallback, {
  valid: [
    `import * as Effect from 'effect/Effect'; Effect.map(source, raw => { try { return JSON.parse(raw) } catch { return null } })`,
    `import * as Effect from 'effect/Effect'; Effect.map(source, value => JSON.parse(JSON.stringify(value)))`,
    `import * as Effect from 'effect/Effect'; Effect.map(source, raw => { function later() { return JSON.parse(raw) } return later })`,
    ...[
      `Effect.map(source, raw => { try { return JSON.parse(raw) } catch { return fallback } })`,
      `Effect.map(source, raw => Effect.try(() => JSON.parse(raw)))`,
      `Effect.map(source, raw => Effect.try({ try: () => JSON.parse(raw), catch: error => error }))`,
      `Effect.map(source, raw => Effect.sync(() => JSON.parse(raw)))`,
      `Effect.map(source, raw => () => JSON.parse(raw))`,
      `Effect.map(source, raw => function () { return JSON.parse(raw) })`,
      `Effect.map(source, raw => { const later = () => JSON.parse(raw); return later })`,
      `Effect.map(() => JSON.parse(raw), mapper)`,
      `Effect.map(source, raw => ({ parse() { return JSON.parse(raw) } }))`,
      `Effect.flatMap(source, raw => JSON.parse(raw))`,
      `Promise.resolve(raw).then(JSON.parse)`,
      `Promise.resolve(raw).then(raw => JSON.parse(raw))`,
      `import { parse } from 'custom'; Effect.map(source, parse)`,
      `import { parse } from 'custom'; Effect.map(source, raw => parse(raw))`,
      `const parse = raw => raw; Effect.map(source, raw => parse(raw))`,
      `import { helper } from 'custom'; Effect.map(source, raw => helper(raw))`,
      `function f(JSON) { return Effect.map(source, JSON.parse) }`,
      `function f(JSON) { return Effect.map(source, raw => JSON.parse(raw)) }`,
      `const JSON = custom; Effect.map(source, raw => JSON.parse(raw))`,
      `import JSON from 'custom'; Effect.map(source, JSON.parse)`,
      `Effect.map(source, JSON => JSON.parse(raw))`,
      `function f(Effect) { return Effect.map(source, JSON.parse) }`,
      `function f(Effect) { return Effect.map(source, raw => JSON.parse(raw)) }`,
      `function f() { const Effect = custom; return Effect.map(source, JSON.parse) }`,
      `Effect.map.other(source, JSON.parse)`,
      `let parse = JSON.parse; Effect.map(source, parse)`,
      `const parse = JSON.parse; function f(parse) { return Effect.map(source, parse) }`,
      `const parse = JSON.parse; parse = custom; Effect.map(source, parse)`,
      `function f(JSON) { const parse = JSON.parse; return Effect.map(source, parse) }`,
      `const { parse } = JSON; Effect.map(source, parse)`,
      `const parse = JSON.parse; Effect.map(source, raw => { try { return parse(raw) } catch { return fallback } })`,
      `const parse = JSON.parse; Effect.map(source, value => parse(JSON.stringify(value)))`,
    ].map((code) => `${effect} ${code}`),
    `import type * as Effect from 'effect/Effect'; Effect.map(source, JSON.parse)`,
    `import { map as transform } from 'effect/Effect'; function f(transform) { return transform(source, JSON.parse) }`,
    `const Effect = custom; Effect.map(source, JSON.parse)`,
  ],
  invalid: [
    {
      code: `import * as Effect from 'effect/Effect'; Effect.map(source, JSON.parse)`,
      errors: [{ messageId: 'callbackParse', column: 60, endColumn: 70 }],
    },
    {
      code: `import * as Effect from 'effect/Effect'; Effect.map(source, raw => JSON.parse(raw))`,
      errors: [{ messageId: 'callbackParse', column: 67, endColumn: 82 }],
    },
    {
      code: `import * as Effect from 'effect/Effect'; const parse = JSON.parse; Effect.map(source, parse)`,
      errors: [{ messageId: 'callbackParse' }],
    },
    {
      code: `import * as Effect from 'effect/Effect'; const parse = JSON.parse; Effect.map(source, raw => parse(raw))`,
      errors: [{ messageId: 'callbackParse' }],
    },
    ...[
      `Effect.map(JSON.parse)`,
      `Effect.map(raw => JSON.parse(raw))`,
      `Effect.tap(source, raw => JSON.parse(raw))`,
      `Effect.andThen(source, function (raw) { return JSON.parse(raw) })`,
      `Effect.mapError(source, raw => JSON.parse(raw))`,
      `Effect.tapError(source, raw => JSON.parse(raw))`,
      `Effect.tapErrorCause(source, raw => JSON.parse(raw))`,
      `Effect.map(source, raw => { try { unrelated() } catch {} return JSON.parse(raw) })`,
      `Effect.map(source, raw => { try { unrelated() } catch { return JSON.parse(raw) } })`,
      `Effect.map(source, raw => { try { unrelated() } catch {} finally { JSON.parse(raw) } })`,
      `Effect.map(source, raw => { try { return JSON.parse(raw) } finally { cleanup() } })`,
      `Effect.map(source, raw => { try { unrelated() } catch { try { unrelated() } finally { JSON.parse(raw) } } })`,
      `try { Effect.map(source, raw => JSON.parse(raw)) } catch { recover() }`,
      `try { Effect.map(source, JSON.parse) } catch { recover() }`,
      `Effect.map(source, raw => Effect.map(inner, raw => JSON.parse(raw)))`,
      `Effect.map(source, raw => JSON['parse'](raw))`,
      `Effect.map(source, raw => JSON.parse(JSON.stringify(raw), reviver))`,
      `Effect.map(source, raw => JSON.parse(custom.stringify(raw)))`,
      `const parse = JSON.parse; source.pipe(Effect.map(parse))`,
      `const parse = JSON.parse; Effect.map(source, () => { const JSON = custom; return parse(raw) })`,
    ].map((code) => ({ code: `${effect} ${code}`, errors: [{ messageId: 'callbackParse' }], output: null })),
    {
      code: `import * as Fx from 'effect/Effect'; source.pipe(Fx.map(raw => JSON.parse(raw)))`,
      errors: [{ messageId: 'callbackParse' }],
      output: null,
    },
    {
      code: `import { map as transform } from 'effect/Effect'; transform(source, JSON.parse)`,
      errors: [{ messageId: 'callbackParse' }],
      output: null,
    },
    {
      code: `import { Effect as Fx } from 'effect'; Fx.map(source, JSON.parse)`,
      languageOptions: { globals: { JSON: 'readonly' } },
      errors: [{ messageId: 'callbackParse' }],
      output: null,
    },
    {
      code: `${effect} Effect.map(source, raw => { try { return JSON.parse(raw) } catch (error) { throw error } })`,
      errors: [{ messageId: 'callbackThrow' }],
      output: null,
    },
    {
      code: `${effect} Effect.map(source, raw => { try { unrelated() } catch {} throw new Error(raw) })`,
      errors: [{ messageId: 'callbackThrow' }],
      output: null,
    },
  ],
});

describe('malformed JSON error channels (Effect 4)', () => {
  it.for([
    // oxlint-disable-next-line 2digits/no-throw-in-effect-callback -- Deliberately inject a parser defect as a runtime control.
    ['direct', Effect.map(Effect.succeed('{'), JSON.parse)],
    // oxlint-disable-next-line 2digits/no-throw-in-effect-callback -- Deliberately inject a parser defect as a runtime control.
    ['inline', Effect.map(Effect.succeed('{'), (raw): unknown => JSON.parse(raw))],
  ] as const)('keeps %s mapping parse defects out of the typed catch', ([_style, parsed]) => {
    const recover = vi.fn<() => Effect.Effect<string>>(() => Effect.succeed('caught'));
    const exit = Effect.runSyncExit(Effect.catch(parsed, recover));

    expect(exit).toMatchObject({
      _tag: 'Failure',
      cause: { reasons: [{ _tag: 'Die', defect: expect.any(SyntaxError) as unknown }] },
    });
    expect(recover).not.toHaveBeenCalled();
  });

  it('recovers an Effect.try parse failure through the typed catch', () => {
    const parsed = Effect.try({
      try: (): unknown => JSON.parse('{'),
      catch: (cause) => ({ _tag: 'InvalidJson' as const, cause }),
    });

    expect(Effect.runSyncExit(parsed)).toMatchObject({
      _tag: 'Failure',
      cause: { reasons: [{ _tag: 'Fail', error: { _tag: 'InvalidJson', cause: expect.any(SyntaxError) as unknown } }] },
    });
    expect(Effect.runSyncExit(Effect.catch(parsed, (error) => Effect.succeed(error._tag)))).toMatchObject({
      _tag: 'Success',
      value: 'InvalidJson',
    });
  });
});
