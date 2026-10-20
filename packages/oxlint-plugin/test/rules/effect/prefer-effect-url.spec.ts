import { testRule } from '../../rule-tester';

testRule('prefer-effect-url', {
  valid: [
    `
    import { Url } from 'effect/unstable/http'
    const parsed = Url.fromString('https://example.com')
  `,
  ],
  invalid: [
    {
      code: `
    import * as Effect from 'effect/Effect'
    const parsed = new URL('https://example.com')
  `,
      errors: [{ messageId: 'effectUrl' }],
    },
  ],
});
