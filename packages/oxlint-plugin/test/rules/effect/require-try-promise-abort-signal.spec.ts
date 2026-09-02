import { requireTryPromiseAbortSignal } from '../../../src/rules/effect/require-try-promise-abort-signal';
import { testRule } from '../../rule-tester';

testRule('require-try-promise-abort-signal', requireTryPromiseAbortSignal, {
  valid: `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise((signal) => fetch('/users', { signal }))
    Effect.tryPromise((_signal) => legacySdk.request())
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise(() => fetch('/users'))
  `,
  messageId: 'missingSignal',
});

testRule('require-try-promise-abort-signal', requireTryPromiseAbortSignal, {
  valid: `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise({ try: (signal) => fetch('/users', { signal }), catch: String })
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    Effect.tryPromise({ try: (signal) => fetch('/users'), catch: String })
  `,
  messageId: 'unusedSignal',
});
