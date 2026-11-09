import { alchemyDomainBlockFileName } from '../../../src/rules/alchemy/alchemy-domain-block-file-name';
import { createRuleTester } from '../../rule-tester';

const header = `import * as Domain from '@alchemy.run/domain'\n`;

const command = `${header}
  export class NotOpen extends Domain.Rejection('NotOpen') {}
  export class MoneyWithdrawn extends Domain.Event('MoneyWithdrawn', {}) {}
  export class WithdrawMoney extends Domain.Command('WithdrawMoney', { events: [MoneyWithdrawn], rejects: [NotOpen] }) {}
`;

createRuleTester().run('alchemy-domain-block-file-name', alchemyDomainBlockFileName, {
  valid: [
    {
      filename: 'src/Account/AccountCard.stream.ts',
      code: `${header}
          export class CardChanged extends Domain.Event('CardChanged', {}) {}
          export class AccountCard extends Domain.Stream('AccountCard', { entries: [CardChanged] }) {}
        `,
    },
    { filename: 'src/Account/WithdrawMoney.command.ts', code: command },
    {
      filename: 'src/Account/Account.aggregate.ts',
      code: `${header}export class Account extends Domain.Aggregate('Account', {}) {}`,
    },
    {
      filename: 'src/Fraud/FraudCheck.external.ts',
      code: `${header}
          export class FraudUnavailable extends Domain.Rejection('FraudUnavailable') {}
          export class FraudCheck extends Domain.ExternalSystem('FraudCheck', {}) {}
        `,
    },
    {
      filename: 'src/CurrentActor.context.ts',
      code: `${header}export class CurrentActor extends Domain.RequestContext<CurrentActor>()('Bank/CurrentActor', Actor) {}`,
    },
    {
      filename: 'src/Account/NotOpen.rejection.ts',
      code: `${header}export class NotOpen extends Domain.Rejection('NotOpen') {}`,
    },
    {
      filename: 'test/Bank.test.ts',
      code: `${header}class A extends Domain.Aggregate('A', {}) {}\nclass B extends Domain.Model('B', {}) {}`,
    },
    { filename: 'src/Account.ts', code: `export class Account extends Aggregate('Account', {}) {}` },
  ],
  invalid: [
    {
      filename: 'src/Orphan/Orphan.command.ts',
      code: `${header}export class Orphan extends Domain.Event('Orphan', {}) {}`,
      errors: [{ messageId: 'fileName', data: { block: 'Event', kind: 'event' } }],
    },
    {
      filename: 'src/Account/Account.ts',
      code: `${header}export class Account extends Domain.Aggregate('Account', {}) {}`,
      errors: [{ messageId: 'fileName', data: { block: 'Aggregate', kind: 'aggregate' } }],
    },
    {
      filename: 'src/Account/Account.aggregate.ts',
      code: `${header}export class AccountSummary extends Domain.View('AccountSummary', {}) {}`,
      errors: [{ messageId: 'fileName', data: { block: 'View', kind: 'view' } }],
    },
    {
      filename: 'src/Account/DepositMoney.command.ts',
      code: `${command}export class DepositMoney extends Domain.Command('DepositMoney', {}) {}`,
      errors: [{ messageId: 'oneBlock', data: { block: 'Command', kind: 'command' } }],
    },
    {
      filename: 'src/Account/aggregate.ts',
      code: `${header}export class Account extends Domain.Aggregate('Account', {}) {}`,
      errors: [{ messageId: 'fileName', data: { block: 'Aggregate', kind: 'aggregate' } }],
    },
    {
      filename: 'src/Account/Account.ts',
      code: `${header}export class NotOpen extends Domain.Rejection('NotOpen') {}`,
      errors: [{ messageId: 'fileName', data: { block: 'Rejection', kind: 'rejection' } }],
    },
    {
      filename: 'src/BookingUnit/BookingUnitChanged.event.ts',
      code: `${header}
          export class BookingUnitRecorded extends Domain.Event('BookingUnitRecorded', {}) {}
          export class BookingUnitWithdrawn extends Domain.Event('BookingUnitWithdrawn', {}) {}
        `,
      errors: [{ messageId: 'oneBlock', data: { block: 'Event', kind: 'event' } }],
    },
  ],
});
