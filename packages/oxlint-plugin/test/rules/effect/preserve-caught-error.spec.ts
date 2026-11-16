import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { preserveCaughtError } from '../../../src/rules/effect/preserve-caught-error';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const imports = `
  import * as Console from 'effect/Console'
  import * as Effect from 'effect/Effect'
  import { pipe } from 'effect/Function'
  import * as Opt from 'effect/Option'
  import * as Ref from 'effect/Ref'
  import * as SchemaIssue from 'effect/SchemaIssue'
`;

const droppedCause = [{ messageId: 'droppedCause' }];

tester.run('preserve-caught-error', preserveCaughtError, {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.mapError((cause) => new DatabaseError({ cause })))
    `,
    `${imports} program.pipe(Effect.catchCause((cause) => Effect.fail(new Failed({ cause }))))`,
    `${imports} program.pipe(Effect.mapError((cause) => Failed.make({ cause })))`,
    // A PascalCase value the handler recovers with, or an Effect constructor, is not a new error.
    `${imports} program.pipe(Effect.catch(() => Effect.succeed(new Fallback())))`,
    `${imports} program.pipe(Effect.catch(() => Effect.sync(() => new Fallback())))`,
    `${imports} program.pipe(Effect.catch(() => Ref.make(0)))`,
    `${imports} program.pipe(Effect.mapError(() => new SchemaIssue.InvalidValue(Opt.none())))`,
    `${imports} program.pipe(Effect.catchTag('NotFound', () => Effect.fail(new Missing())))`,
    // The failure was logged before the handler narrows it.
    `${imports} program.pipe(Effect.tapError(Effect.logError), Effect.mapError(() => new DatabaseError()))`,
    `${imports} program.pipe(Effect.tapCause(Effect.logError), Effect.catch(() => Effect.fail(new DatabaseError())))`,
    `${imports} program.pipe(Effect.tapError(Console.error), Effect.mapError(() => DatabaseError.make({})))`,
    `${imports} program.pipe(Effect.tapError((error) => Effect.logWarning('read failed', error)), Effect.mapError(() => new DatabaseError()))`,
    `${imports} program.pipe(Effect.tapError(Effect.logError)).pipe(Effect.map(f), Effect.mapError(() => new DatabaseError()))`,
    `${imports} pipe(program, Effect.tapError(Effect.logError), Effect.mapError(() => new DatabaseError()))`,
    `${imports} Effect.mapError(Effect.tapError(program, Effect.logError), () => new DatabaseError())`,
    `${imports} Effect.fn('read')(function* () {}, Effect.tapCause(Effect.logError), Effect.catch(() => Effect.fail(new DatabaseError())))`,
  ],
  invalid: [
    {
      code: `
      import * as Fx from 'effect/Effect'
      program.pipe(Fx.mapError(() => new DatabaseError({ message: 'failed' })))
      `,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.catchCause(() => Effect.fail(new DatabaseError())))`,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.mapError(() => DatabaseError.make({ message: 'failed' })))`,
      errors: droppedCause,
    },
    // PascalCase classes without an `Error` suffix count when the handler fails with them.
    {
      code: `${imports} program.pipe(Effect.mapError(() => new BadRequest({ reason: 'Invalid JSON' })))`,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.mapError(() => { const reason = 'Invalid JSON'; return Errors.BadRequest.make({ reason }) }))`,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.catch(() => Effect.fail(new Unavailable())))`,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.catch(() => Effect.gen(function* () { return yield* new Unavailable() })))`,
      errors: droppedCause,
    },
    // Only a tap that logs the failure, before the handler, exempts it.
    {
      code: `${imports} program.pipe(Effect.tapError(() => Effect.logError('read failed')), Effect.mapError(() => new Failed()))`,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.tapErrorTag('NotFound', Effect.logError), Effect.mapError(() => new Failed()))`,
      errors: droppedCause,
    },
    {
      code: `${imports} program.pipe(Effect.mapError(() => new Failed()), Effect.tapError(Effect.logError))`,
      errors: droppedCause,
    },
  ],
});
