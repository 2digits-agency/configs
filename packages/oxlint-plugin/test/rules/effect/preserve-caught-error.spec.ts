import { preserveCaughtError } from '../../../src/rules/effect/preserve-caught-error';
import { testRule } from '../../rule-tester';

testRule('preserve-caught-error', preserveCaughtError, {
  valid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.mapError((cause) => new DatabaseError({ cause })))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.mapError(() => new DatabaseError({ message: 'failed' })))
  `,
  messageId: 'droppedCause',
});
