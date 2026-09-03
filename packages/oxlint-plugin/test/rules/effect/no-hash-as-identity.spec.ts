import { noHashAsIdentity } from '../../../src/rules/effect/no-hash-as-identity';
import { testRule } from '../../rule-tester';

testRule('no-hash-as-identity', noHashAsIdentity, {
  valid: `
    import * as HashMap from 'effect/HashMap'
    HashMap.set(cache, payload, result)
  `,
  invalid: `
    import * as Hash from 'effect/Hash'
    cache.set(Hash.hash(payload), result)
  `,
  messageId: 'hashIdentity',
});
