import { alchemyNoV1WorkerProperties } from '../../../src/rules/alchemy/alchemy-no-v1-worker-properties';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-v1-worker-properties', alchemyNoV1WorkerProperties, {
  valid: `
    import * as CF from 'alchemy/Cloudflare'
    CF.Worker('Worker', { main: './worker.ts', env: {} })
  `,
  invalid: `
    import * as CF from 'alchemy/Cloudflare'
    CF.Worker('Worker', { entrypoint: './worker.ts' })
  `,
  messageId: 'property',
});
