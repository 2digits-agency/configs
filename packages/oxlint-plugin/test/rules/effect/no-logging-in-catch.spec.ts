import { noLoggingInCatch } from '../../../src/rules/effect/no-logging-in-catch';
import { testRule } from '../../rule-tester';

testRule('no-logging-in-catch', noLoggingInCatch, {
  valid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.tapError(Fx.logError), Fx.catchAll(() => Fx.succeed(null)))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.catchAll((error) => Fx.logError(error)))
  `,
  messageId: 'logging',
});
