import { testRule } from '../../rule-tester';

testRule('no-hash-as-identity', {
  valid: [
    `
    import * as HashMap from 'effect/HashMap'
    HashMap.set(cache, payload, result)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Hash from 'effect/Hash'
    cache.set(Hash.hash(payload), result)
  `,
      errors: [{ messageId: 'hashIdentity' }],
    },
  ],
});
