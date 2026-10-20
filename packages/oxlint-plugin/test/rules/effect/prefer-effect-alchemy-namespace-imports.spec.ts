import { testRule } from '../../rule-tester';

testRule('prefer-effect-alchemy-namespace-imports', {
  valid: [
    `
    import * as Arr from 'effect/Array'
    import * as Cloudflare from 'alchemy/Cloudflare'
    import { Url, Headers } from 'effect/unstable/http'
    import { describe, expect } from '@effect/vitest'
    import { deepStrictEqual } from '@effect/vitest/utils'
  `,
    `import * as P from 'effect/Predicate'`,
  ],
  invalid: [
    {
      code: `import { sort } from 'effect/Array'`,
      errors: [{ messageId: 'namespace' }],
      output: `import * as Arr from 'effect/Array';`,
    },
    {
      code: `import * as Predicate from 'effect/Predicate'`,
      errors: [{ messageId: 'alias' }],
      output: `import * as P from 'effect/Predicate';`,
    },
  ],
});
