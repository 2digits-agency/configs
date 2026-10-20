import { testRule } from '../../rule-tester';

testRule('prefer-effect-headers', {
  valid: [
    `
    import { Headers } from 'effect/unstable/http'
    const headers = Headers.fromInput({ authorization: 'secret' })
  `,
  ],
  invalid: [
    {
      code: `
    import * as Effect from 'effect/Effect'
    const headers = new Headers({ authorization: 'secret' })
  `,
      errors: [{ messageId: 'effectHeaders' }],
    },
  ],
});
