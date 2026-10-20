import { testRule } from '../../rule-tester';

testRule('no-effect-alchemy-barrel-imports', {
  valid: [
    `
    import * as Arr from 'effect/Array'
    import { pipe, type Effect } from 'effect'
    import { describe, layer } from '@effect/vitest'
    import * as Alchemy from 'alchemy'
  `,
    `import * as Cloudflare from 'alchemy/Cloudflare'`,
  ],
  invalid: [
    {
      code: `import { Array as Arr } from 'effect'`,
      errors: [{ messageId: 'barrelImport' }],
      output: `import * as Arr from 'effect/Array';`,
    },
    {
      code: `import { Cloudflare } from 'alchemy'`,
      errors: [{ messageId: 'barrelImport' }],
      output: `import * as Cloudflare from 'alchemy/Cloudflare';`,
    },
  ],
});
