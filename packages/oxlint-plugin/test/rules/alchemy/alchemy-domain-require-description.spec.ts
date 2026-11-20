import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainRequireDescription } from '../../../src/rules/alchemy/alchemy-domain-require-description';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `import * as Domain from '@alchemy.run/domain'\n`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-require-description',
  alchemyDomainRequireDescription,
  {
    valid: [
      {
        filename: 'src/Account/WithdrawMoney.command.ts',
        code: `${header}export class WithdrawMoney extends Domain.Command('WithdrawMoney', { target: AccountId }, { description: 'Take money out.' }) {}`,
      },
      {
        filename: 'src/Account/NotOpen.rejection.ts',
        code: `${header}export class NotOpen extends Domain.Rejection('NotOpen', {}, { httpApiStatus: 409, description: 'Closed.' } as const) {}`,
      },
      {
        filename: 'src/Account/AccountSummary.view.ts',
        code: `${header}export class AccountSummary extends Domain.View('AccountSummary', { version: 0 }, { ...shared }) {}`,
      },
      {
        filename: 'src/Account/AccountSummary.view.ts',
        code: `${header}export class AccountSummary extends Domain.View('AccountSummary', { version: 0 }, annotations) {}`,
      },
      {
        filename: 'src/CurrentActor.context.ts',
        code: `${header}export class CurrentActor extends Domain.RequestContext<CurrentActor>()('Bank/CurrentActor', Actor) {}`,
      },
      {
        filename: 'test/Bank.story.test.ts',
        code: `${header}class Opened extends Domain.Event('Opened', {}) {}`,
      },
      { filename: 'src/Opened.event.ts', code: `export class Opened extends Other.Event('Opened', {}) {}` },
    ],
    invalid: [
      {
        filename: 'src/Account/MoneyWithdrawn.event.ts',
        code: `${header}export class MoneyWithdrawn extends Domain.Event('MoneyWithdrawn', { amount: Cents }) {}`,
        errors: [{ messageId: 'missing', data: { block: 'Event' } }],
      },
      {
        filename: 'src/CustomerApi.api.ts',
        code: `${header}export class CustomerApi extends Domain.Api('CustomerApi', { model: Bank }, { httpApiCacheControl: 'private' }) {}`,
        errors: [{ messageId: 'missing', data: { block: 'Api' } }],
      },
      {
        filename: 'src/Ledger/AccountLedger.query.ts',
        code: `${header}export class AccountLedger extends Domain.Query('AccountLedger', { success: LedgerRow }, {}) {}`,
        errors: [{ messageId: 'missing', data: { block: 'Query' } }],
      },
    ],
  },
);
