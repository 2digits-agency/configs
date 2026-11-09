import { preferEffectMatchStatus } from '../../../src/rules/effect/prefer-effect-match-status';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Effect from 'effect/Effect'
  const redirect = response.status >= 300 && response.status < 400
  const outside = response.status < 200 || response.status >= 400
  const bare = status >= 200 && status < 300
  const mixed = first.status >= 200 && second.status < 300
  const always = response.status >= 200 || response.status < 300
  const retry = response.status === 429 || response.status >= 500
`;

for (const invalid of [
  'response.status < 200 || response.status >= 300',
  'response.status >= 200 && response.status < 300',
  '200 <= res.status && res.status <= 299',
  'error.response.statusCode > 299 || error.response.statusCode < 200',
]) {
  testRule('prefer-effect-match-status', preferEffectMatchStatus, {
    valid,
    invalid: `
      import * as Effect from 'effect/Effect'
      const failed = ${invalid}
    `,
    messageId: 'matchStatus',
  });
}
