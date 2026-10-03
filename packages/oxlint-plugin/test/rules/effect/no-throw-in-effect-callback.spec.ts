import { RuleTester } from 'oxlint/plugins-dev';

import { noThrowInEffectCallback } from '../../../src/rules/effect/no-throw-in-effect-callback';
import { testRule } from '../../rule-tester';

const ruleName = 'no-throw-in-effect-callback';

testRule(ruleName, noThrowInEffectCallback, {
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

testRule(ruleName, noThrowInEffectCallback, {
  valid: `
    import * as Effect from 'effect/Effect'
    Effect.try({
      try: () => fail(),
      catch: e => {
        try { throw e; }
        catch (handled) { return handled; }
      },
    })
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    Effect.try({ try: () => fail(), catch: e => { throw e; } })
  `,
  messageId: 'callbackThrow',
});

testRule(ruleName, noThrowInEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.map(source, () => { function deferred() { throw 'deferred'; } return deferred; })
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    try { Fx.map(source, () => { throw 'callback'; }); } catch { }
  `,
  messageId: 'callbackThrow',
});

testRule(ruleName, noThrowInEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    function unrelated(Fx) {
      Fx.map(source, () => { throw 'custom'; })
      Fx.try({ try: () => work(), catch: e => { throw e; } })
    }
  `,
  invalid: `
    import { map as transform } from 'effect/Effect'
    transform(source, () => { throw 'effect'; })
  `,
  messageId: 'callbackThrow',
});

testRule(ruleName, noThrowInEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.map(source, () => { try { throw 'handled'; } catch { return null; } })
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.map(source, () => { try { throw 'unsafe'; } catch { return missing; } })
  `,
  messageId: 'callbackThrow',
});

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

/* eslint-disable unicorn/no-null -- RuleTester requires output: null to assert no autofix. */
// RuleTester locations use one-based lines and zero-based columns.
tester.run('no-throw-in-effect-callback containment', noThrowInEffectCallback, {
  valid: [
    ...['try', 'tryPromise'].map((method) => ({
      code: `import { Effect as Fx } from 'effect';
Fx.${method}({ try: () => work(), catch: e => {
  try { throw e; } catch (handled) { return handled; }
} });`,
    })),
    ...['andThen', 'map', 'mapError', 'tap', 'tapError', 'tapErrorCause'].map((method) => ({
      code: `import * as Fx from 'effect/Effect';
source.pipe(Fx.${method}(value => {
  try { throw value; } catch { ; {} return; } finally { }
}));`,
    })),
    `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  try { throw value; } catch { return value; }
});`,
    `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  try {
    try { throw value; } catch (e) { throw e; } finally { throw 'finalizer'; }
  } catch (handled) { return handled; }
});`,
    `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  try { try { throw value; } finally { } } catch { }
  return value;
});`,
    `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  const deferred = () => { throw value; };
  const other = function () { throw value; };
  return deferred;
});`,
    `import * as Fx from 'effect/Effect';
Fx.map(source, value => Fx.try({ try: () => { throw value; }, catch: e => e }));`,
    `import * as Fx from 'unrelated';
Fx.map(source, () => { throw 'custom'; });
Fx.try({ try: () => work(), catch: e => { throw e; } });`,
    `import { map as transform } from 'effect/Effect';
function unrelated(transform) { transform(source, () => { throw 'custom'; }); }`,
    `import * as Fx from 'effect/Effect';
{ const Fx = custom; Fx.tryPromise({ try: () => work(), catch: e => { throw e; } }); }`,
  ],
  invalid: [
    ...['andThen', 'map', 'mapError', 'tap', 'tapError', 'tapErrorCause'].map((method) => ({
      code: `import * as Fx from 'effect/Effect';
Fx.${method}(source, value => {
  throw value;
});`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 3, column: 2 }],
      output: null,
    })),
    {
      code: `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  try {
    throw value;
  } catch (e) {
    if (e) throw e;
    return null;
  }
});`,
      errors: [
        { messageId: 'callbackThrow', type: 'ThrowStatement', line: 4, column: 4 },
        { messageId: 'callbackThrow', type: 'ThrowStatement', line: 6, column: 11 },
      ],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect';
Fx.tryPromise({ try: () => work(), catch: value => {
  try {
    throw value;
  } catch (e) {
    return e;
  } finally {
    throw 'finalizer';
  }
} });`,
      errors: [
        { messageId: 'callbackThrow', type: 'ThrowStatement', line: 4, column: 4 },
        { messageId: 'callbackThrow', type: 'ThrowStatement', line: 8, column: 4 },
      ],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect';
Fx.map(source, () => {
  try { work(); } catch (e) {
    throw e;
  }
});`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 4, column: 4 }],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect';
Fx.map(source, () => {
  try { work(); } finally {
    throw 'finalizer';
  }
});`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 4, column: 4 }],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect';
Fx.map(source, () => {
  try { throw 'caught'; } catch { }
  throw 'after';
});`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 4, column: 2 }],
      output: null,
    },
    ...[
      'catch { return translate(); }',
      'catch (e) { return e.message; }',
      'catch ({ message }) { return message; }',
      'catch (e) { { return e; let e; } }',
      'catch { return null; } finally { cleanup(); }',
      'finally { }',
    ].map((handler) => ({
      code: `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  try { throw value; } ${handler}
});`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 3, column: 8 }],
      output: null,
    })),
    {
      code: `import * as Fx from 'effect/Effect';
function f(result = Fx.runSync(Fx.map(Fx.succeed(null), () => {
  try { throw 'original'; } catch { return later; }
})), later = 0) { return result; }`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 3, column: 8 }],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect';
try { throw {}; } catch ({ first = Fx.runSync(Fx.map(source, () => {
  try { throw 'original'; } catch { return later; }
})), later }) { }`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 3, column: 8 }],
      output: null,
    },
    {
      code: `import * as Fx from 'effect/Effect';
Fx.map(source, value => {
  try {
    Fx.map(source, () => { throw value; });
  } catch { }
});`,
      errors: [{ messageId: 'callbackThrow', type: 'ThrowStatement', line: 4, column: 27 }],
      output: null,
    },
  ],
});
/* eslint-enable unicorn/no-null */
