import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noEffectAsOnLog } from '../../../src/rules/effect/no-effect-as-on-log';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

tester.run('no-effect-as-on-log', noEffectAsOnLog, {
  valid: [
    `
      import * as Effect from 'effect/Effect'
      Effect.gen(function* () {
        yield* Effect.logInfo('ignored')
        return false
      })
    `,
    `
      import * as Effect from 'effect/Effect'
      fetchUser.pipe(Effect.as(false), Effect.tap(Effect.logInfo('done')))
    `,
    `
      import * as Effect from 'effect/Effect'
      const logger = { log: (message) => Effect.succeed(message) }
      logger.log('ignored').pipe(Effect.as(false))
    `,
  ],
  invalid: [
    {
      code: `
        import * as Effect from 'effect/Effect'
        Effect.logInfo('Shopify webhook ignored', { topic }).pipe(Effect.as(false))
      `,
      errors: [{ messageId: 'asOnLog', data: { logger: 'Effect.logInfo', method: 'as' } }],
    },
    {
      code: `
        import { Effect as Fx } from 'effect'
        Fx.logWarning('retrying').pipe(Fx.asSome)
      `,
      errors: [{ messageId: 'asOnLog', data: { logger: 'Effect.logWarning', method: 'asSome' } }],
    },
    {
      code: `
        import * as Effect from 'effect/Effect'
        Effect.as(Effect.logDebug('skipped'), Option.none())
      `,
      errors: [{ messageId: 'asOnLog', data: { logger: 'Effect.logDebug', method: 'as' } }],
    },
    {
      code: `
        import * as Effect from 'effect/Effect'
        import { pipe } from 'effect/Function'
        pipe(Effect.logWithLevel('Info')('skipped'), Effect.as(0))
      `,
      errors: [{ messageId: 'asOnLog', data: { logger: 'Effect.logWithLevel', method: 'as' } }],
    },
    {
      code: `
        import * as Console from 'effect/Console'
        import * as Effect from 'effect/Effect'
        Console.log('done').pipe(Effect.asVoid)
      `,
      errors: [{ messageId: 'asVoidOnLog', data: { logger: 'Console.log' } }],
    },
    {
      code: `
        import * as Effect from 'effect/Effect'
        Effect.asVoid(Effect.logError('failed'))
      `,
      errors: [{ messageId: 'asVoidOnLog', data: { logger: 'Effect.logError' } }],
    },
  ],
});
