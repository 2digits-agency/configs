import { testRule } from '../../rule-tester';

testRule('preserve-caught-error', {
  valid: [
    `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.mapError((cause) => new DatabaseError({ cause })))
  `,
  ],
  invalid: [
    {
      code: `
    import * as Fx from 'effect/Effect'
    program.pipe(Fx.mapError(() => new DatabaseError({ message: 'failed' })))
  `,
      errors: [{ messageId: 'droppedCause' }],
    },
  ],
});
