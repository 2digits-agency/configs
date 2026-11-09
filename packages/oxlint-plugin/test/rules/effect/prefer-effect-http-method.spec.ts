import { preferEffectHttpMethod } from '../../../src/rules/effect/prefer-effect-http-method';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Schema from 'effect/Schema'
  const safe = Schema.Literals(['GET', 'HEAD'])
  type PartnerMethod = 'GET' | 'POST'
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  const lowercase = ['get', 'post', 'put', 'patch', 'delete', 'head']
  const repeated = ['GET', 'GET', 'POST', 'POST', 'PUT', 'PUT']
  const mixed = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', method]
`;

for (const invalid of [
  "const Method = Schema.Literals(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])",
  "type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'",
  "const known = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].includes(method)",
]) {
  testRule('prefer-effect-http-method', preferEffectHttpMethod, {
    valid,
    invalid: `
      import * as Schema from 'effect/Schema'
      ${invalid}
    `,
    messageId: 'methodList',
  });
}

testRule('prefer-effect-http-method', preferEffectHttpMethod, {
  valid: "type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'",
  invalid: `import type { Effect } from 'effect'; type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'`,
  messageId: 'methodList',
});
