import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainApiExplicitMembers } from '../../../src/rules/alchemy/alchemy-domain-api-explicit-members';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `import * as Domain from '@alchemy.run/domain'\n`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-api-explicit-members',
  alchemyDomainApiExplicitMembers,
  {
    valid: [
      `${header}export class CustomerApi extends Domain.Api('CustomerApi', { model: Bank, commands: ['Deposit'], views: [], streams: [], queries: [] }) {}`,
      `${header}export class CustomerApi extends Domain.Api('CustomerApi', { model: Bank, ...everything }) {}`,
      `${header}export class CustomerApi extends Domain.Api('CustomerApi', options) {}`,
      `${header}export class Summary extends Domain.View('Summary', { model: Bank }) {}`,
      `export class CustomerApi extends Other.Api('CustomerApi', { model: Bank }) {}`,
    ],
    invalid: [
      {
        code: `${header}export class DeskApi extends Domain.Api('DeskApi', { model: Desk, commands: [], views: ['Overview'], streams: [] }) {}`,
        errors: [{ messageId: 'missing', data: { kinds: '`queries`' } }],
      },
      {
        code: `${header}export class CustomerApi extends Domain.Api('CustomerApi', { model: Bank, views: ['Summary'] } satisfies Options) {}`,
        errors: [{ messageId: 'missing', data: { kinds: '`commands`, `streams`, `queries`' } }],
      },
    ],
  },
);
