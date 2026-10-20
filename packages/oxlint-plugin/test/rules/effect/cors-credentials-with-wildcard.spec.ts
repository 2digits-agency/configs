import { testRule } from '../../rule-tester';

testRule('cors-credentials-with-wildcard', {
  valid: [
    `
    import { HttpMiddleware as Middleware } from 'effect/unstable/http'
    Middleware.cors({ credentials: true, allowedOrigins: ['https://example.com'] })
  `,
  ],
  invalid: [
    {
      code: `
    import { HttpMiddleware as Middleware } from 'effect/unstable/http'
    Middleware.cors({ credentials: true })
  `,
      errors: [{ messageId: 'wildcard' }],
    },
  ],
});
