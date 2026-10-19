import { testRule } from '../../rule-tester';

testRule('prefer-effect-encoding', {
  valid: [
    `
    import * as Encoding from 'effect/Encoding'
    const encoded = Encoding.encodeBase64('hello')
  `,
  ],
  invalid: [
    {
      code: `
    import * as Effect from 'effect/Effect'
    const encoded = btoa('hello')
  `,
      errors: [{ messageId: 'effectEncoding' }],
    },
  ],
});
