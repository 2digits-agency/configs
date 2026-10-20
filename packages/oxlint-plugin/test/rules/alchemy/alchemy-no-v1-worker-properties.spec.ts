import { testRule } from '../../rule-tester';

testRule('alchemy-no-v1-worker-properties', {
  valid: [
    `
    import * as CF from 'alchemy/Cloudflare'
    CF.Worker('Worker', { main: './worker.ts', env: {} })
  `,
  ],
  invalid: [
    {
      code: `
    import * as CF from 'alchemy/Cloudflare'
    CF.Worker('Worker', { entrypoint: './worker.ts' })
  `,
      errors: [{ messageId: 'property' }],
      output: `
    import * as CF from 'alchemy/Cloudflare'
    CF.Worker('Worker', { main: './worker.ts' })
  `,
    },
  ],
});
