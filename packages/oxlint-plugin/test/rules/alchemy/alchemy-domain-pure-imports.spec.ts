import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainPureImports } from '../../../src/rules/alchemy/alchemy-domain-pure-imports';

RuleTester.describe = describe;

RuleTester.it = it;

const filename = 'src/DailyImport/DailyImport.aggregate.ts';

const header = `import * as Domain from '@alchemy.run/domain'\n`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-pure-imports',
  alchemyDomainPureImports,
  {
    valid: [
      {
        filename,
        code: `${header}
          import * as Schema from 'effect/Schema'
          import { Effect } from 'effect'
          import { RpcMiddleware } from 'effect/unstable/rpc'
          import * as Story from '@alchemy.run/domain/Story'
          import { DailyImportId } from './DailyImport.id.ts'
          export { BusinessDay } from '../BusinessDay.ts'
        `,
      },
      { filename: 'src/server/ExactJournal.ts', code: `${header}import { HttpClient } from '@bylotte/exact'` },
      { filename: 'src/models/user.model.ts', code: `import mongoose from 'mongoose'` },
      {
        filename,
        code: `${header}export function load(require) { return require('@aws-sdk/client-s3') }`,
      },
    ],
    invalid: [
      {
        filename,
        code: `${header}import * as Cloudflare from 'alchemy/Cloudflare'`,
        errors: [{ messageId: 'import', data: { source: 'alchemy/Cloudflare' } }],
      },
      {
        filename,
        code: `${header}export const s3 = () => import('@aws-sdk/client-s3')\nexport const id = () => import('./DailyImport.id.ts')`,
        errors: [{ messageId: 'import', data: { source: '@aws-sdk/client-s3' } }],
      },
      {
        filename,
        code: `${header}export const load = (name: string) => import(name)`,
        errors: [{ messageId: 'dynamic' }],
      },
      {
        filename,
        code: `${header}const S3 = require('@aws-sdk/client-s3')\nconst id = require('./DailyImport.id.ts')`,
        errors: [{ messageId: 'import', data: { source: '@aws-sdk/client-s3' } }],
      },
      {
        filename: 'src/Session.middleware.ts',
        code: `${header}import type { ExactToken } from '@bylotte/exact'\nexport * from '@bylotte/contracts'`,
        errors: [
          { messageId: 'import', data: { source: '@bylotte/exact' } },
          { messageId: 'import', data: { source: '@bylotte/contracts' } },
        ],
      },
    ],
  },
);
