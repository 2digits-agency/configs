import { corsCredentialsWithWildcard } from '../../../src/rules/effect/cors-credentials-with-wildcard';
import { testRule } from '../../rule-tester';

testRule('cors-credentials-with-wildcard', corsCredentialsWithWildcard, {
  valid: `
    import { HttpMiddleware as Middleware } from 'effect/unstable/http'
    Middleware.cors({ credentials: true, allowedOrigins: ['https://example.com'] })
  `,
  invalid: `
    import { HttpMiddleware as Middleware } from 'effect/unstable/http'
    Middleware.cors({ credentials: true })
  `,
  messageId: 'wildcard',
});
