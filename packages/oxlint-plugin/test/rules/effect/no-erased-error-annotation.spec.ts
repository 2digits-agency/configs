/* oxlint-disable unicorn/no-null -- Assert that this suggestion never offers a fix. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noErasedErrorAnnotation } from '../../../src/rules/effect/no-erased-error-annotation';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

const effect = `import { Effect } from 'effect';`;
const recovered = `Effect.tryPromise({ try: () => qrCode(), catch: cause => cause }).pipe(Effect.orElseSucceed(() => ''))`;

tester.run('no-erased-error-annotation', noErasedErrorAnnotation, {
  valid: [
    `import { Effect } from 'effect';
     function qr(): Effect.Effect<string, ProfileError> {
       return Effect.tryPromise({ try: () => qrCode(), catch: cause => new ProfileError(cause) });
     }`,
    ...[
      'never',
      'unknown',
      'any',
      'string',
      'object',
      'ProfileError | unknown',
      'ProfileError | never',
      'ProfileError<E>',
      '{ _tag: "Error" }',
      'typeof ProfileError',
      'profileError',
    ].map((error) => `${effect} const qr = (): Effect.Effect<string, ${error}> => ${recovered};`),
    `${effect} function qr<E>(): Effect.Effect<string, E> { return ${recovered}; }`,
    `${effect} function qr<ProfileError>(): Effect.Effect<string, ProfileError> { return ${recovered}; }`,
    `${effect} function wrapper<E>() { return (): Effect.Effect<string, E> => ${recovered}; }`,
    `${effect} class Api<E> { qr(): Effect.Effect<string, E> { return ${recovered}; } }`,
    `${effect} function wrapper<E>() { return (): Effect.Effect<string, ProfileError | E> => ${recovered}; }`,
    `${effect} function qr(): Effect.Effect<string, ProfileError> {
      if (flag) return ${recovered};
      return ${recovered};
    }`,
    `${effect} function qr(): Effect.Effect<string, ProfileError> { const x = 1; return ${recovered}; }`,
    `${effect} function qr(): Effect.Effect<string, ProfileError> { for (;;) { return ${recovered}; } }`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => flag ? ${recovered} : other;`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => ${recovered} as Effect.Effect<string, ProfileError>;`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => <Effect.Effect<string, ProfileError>>${recovered};`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => ${recovered} satisfies Effect.Effect<string, ProfileError>;`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => (Effect.fail(error) as any).pipe(Effect.ignore);`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => other.pipe(Effect.ignore);`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => Effect.fail(error).pipe(Effect.ignore, Effect.flatMap(() => Effect.fail(error)));`,
    `${effect} const qr = (): Effect.Effect<string, ProfileError> => ${recovered}.pipe(Effect.flatMap(() => Effect.fail(error)));`,
    `${effect} declare function qr(): Effect.Effect<string, ProfileError>;`,
    `${effect} abstract class Api { abstract qr(): Effect.Effect<string, ProfileError>; }`,
    `${effect} function qr(x: string): Effect.Effect<string, ProfileError>;
      function qr(x: number): Effect.Effect<string, ProfileError>;
      function qr(x: string | number) { return ${recovered}; }`,
    `import { Effect } from 'unrelated'; const qr = (): Effect.Effect<string, ProfileError> => ${recovered};`,
    `import { Effect } from '@effect/platform'; const qr = (): Effect.Effect<string, ProfileError> => ${recovered};`,
    `import * as Effect from 'effect/other/Effect'; const qr = (): Effect.Effect<string, ProfileError> => ${recovered};`,
    `const Effect = other; const qr = (): Effect.Effect<string, ProfileError> => ${recovered};`,
    `${effect} function qr(Effect): Effect.Effect<string, ProfileError> { return ${recovered}; }`,
    `${effect} function wrapper(Effect) { return (): Effect.Effect<string, ProfileError> => ${recovered}; }`,
    `${effect} function wrapper() { const Effect = other; return (): Effect.Effect<string, ProfileError> => ${recovered}; }`,
    `${effect} import { orElseSucceed as recover } from 'effect/Effect';
      function qr(recover): Effect.Effect<string, ProfileError> { return Effect.fail(error).pipe(recover(() => '')); }`,
    `${effect} import { fail as failWith } from 'effect/Effect';
      function qr(failWith): Effect.Effect<string, ProfileError> { return failWith(error).pipe(Effect.ignore); }`,
    `${effect} const qr = (): Effect.Effect<string> => ${recovered};`,
    `${effect} const qr = (): Stream.Stream<string, ProfileError> => ${recovered};`,
    `${effect} const qr = (): Layer.Layer<string, ProfileError> => ${recovered};`,
    `${effect} const qr = async (): Effect.Effect<string, ProfileError> => ${recovered};`,
    `${effect} function* qr(): Effect.Effect<string, ProfileError> { return ${recovered}; }`,
  ],
  invalid: [
    {
      code: `import { Effect } from 'effect';
function qr(): Effect.Effect<string, ProfileError> {
  return Effect.tryPromise({ try: () => qrCode(), catch: cause => new ProfileError(cause) })
    .pipe(Effect.orElseSucceed(() => ''));
}`,
      errors: [{ messageId: 'erased', line: 2, column: 37, endLine: 2, endColumn: 49 }],
      output: null,
    },
    ...[
      `import { Effect as Fx } from 'effect';
        const qr = function(): Fx.Effect<string, ProfileError> { return Fx.fail(error).pipe(Fx.orElseSucceed(() => '')); };`,
      `import * as Eff from 'effect';
        const qr = (): Eff.Effect.Effect<string, ProfileError> => Eff.Effect.fail(error).pipe(Eff.Effect.ignore);`,
      `import { type Effect as Fx, fail as failWith, orDie as die } from 'effect/Effect';
        const qr = (): Fx<string, ProfileError> => failWith(error).pipe(die);`,
      `import * as Fx from 'effect/Effect';
        class Api { qr(): Fx.Effect<string, ProfileError> { return Fx.fail(error).pipe(Fx.ignore); } }`,
      `${effect} function qr(): Effect.Effect<string, ProfileError> {
        return Effect.fail(error).pipe(Effect.flatMap(() => Effect.fail(otherError)), Effect.orElseSucceed(() => ''));
      }`,
    ].map((code) => ({ code, errors: [{ messageId: 'erased' }], output: null })),
    ...['ignore', 'orDie'].flatMap((operator) =>
      [
        'tryPromise({ try: () => qrCode(), catch: cause => cause })',
        'try(() => work())',
        'fail(new ProfileError())',
        'gen(function* () { yield* work(); })',
      ].map((constructor) => ({
        code: `import * as Fx from 'effect/Effect';
          const qr = (): Fx.Effect<string, ProfileError | Errors.OtherError, Service> =>
            Fx.${constructor}.pipe(Fx.${operator});`,
        errors: [{ messageId: 'erased', data: { error: 'ProfileError | Errors.OtherError' } }],
        output: null,
      })),
    ),
  ],
});
