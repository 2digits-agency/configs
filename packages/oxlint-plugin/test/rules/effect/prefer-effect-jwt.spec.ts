import { preferEffectJwt } from '../../../src/rules/effect/prefer-effect-jwt';
import { createRuleTester } from '../../rule-tester';

const tester = createRuleTester();

const effect = "import * as Effect from 'effect/Effect'\nimport * as Str from 'effect/String'\n";

tester.run('prefer-effect-jwt', preferEffectJwt, {
  valid: [
    "import { jwtVerify } from 'jose'\nconst [, payload] = token.split('.')",
    `${effect}const [major, minor, patch] = version.split('.')`,
    `${effect}const parts = Str.split(hostname, '.')`,
    `${effect}const scopes = token.split(' ')`,
    `${effect}const segments = Str.split(token, ',')`,
    `${effect}import { jwt } from 'better-auth/plugins/jwt'`,
    `${effect}import { Jwt } from 'effect/jose'\nconst verified = Jwt.decodeUnverified(token)`,
  ],
  invalid: [
    {
      code: `${effect}import { jwtVerify } from 'jose'`,
      errors: [{ messageId: 'jwtLibrary', data: { source: 'jose' } }],
    },
    {
      code: `${effect}import jwt from 'jsonwebtoken'`,
      errors: [{ messageId: 'jwtLibrary', data: { source: 'jsonwebtoken' } }],
    },
    {
      code: `${effect}const claims = JSON.parse(atob(identityToken.split('.')[1]))`,
      errors: [{ messageId: 'manualJwt' }],
    },
    {
      code: `${effect}const parts = request.headers.jwt.split('.')`,
      errors: [{ messageId: 'manualJwt' }],
    },
    {
      code: `${effect}const [header, payload, signature, extra] = Str.split(token, '.')`,
      errors: [{ messageId: 'manualJwt' }],
    },
    {
      code: `${effect}const [header, payload, signature] = bearer.split('.')`,
      errors: [{ messageId: 'manualJwt' }],
    },
  ],
});
