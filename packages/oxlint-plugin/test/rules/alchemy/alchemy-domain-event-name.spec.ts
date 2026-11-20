import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainEventName } from '../../../src/rules/alchemy/alchemy-domain-event-name';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `import * as Domain from '@alchemy.run/domain'\n`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-event-name',
  alchemyDomainEventName,
  {
    valid: [
      `${header}export class MoneyWithdrawn extends Domain.Event('MoneyWithdrawn', {}) {}`,
      `${header}export class TicketEdited extends Domain.Event('TicketEdited', {}) {}`,
      // A command may end in Set or Changed, and an event may start with Set.
      `${header}export class RecordChangeSet extends Domain.Command('RecordChangeSet', {}) {}`,
      `${header}export class SettlementRecorded extends Domain.Event('SettlementRecorded', {}) {}`,
      `${header}export class Settle extends Domain.Command('Settle', {}) {}`,
      `${header}export class UpdatesPaused extends Domain.Event('UpdatesPaused', {}) {}`,
      `${header}export class RosterChanged extends Domain.View('RosterChanged', {}) {}`,
      `export class RosterChanged extends Other.Event('RosterChanged', {}) {}`,
    ],
    invalid: [
      {
        code: `${header}export class RosterChanged extends Domain.Event('RosterChanged', {}) {}`,
        errors: [{ messageId: 'event', data: { name: 'RosterChanged' } }],
      },
      {
        code: `${header}export class BalanceSet extends Domain.Event('BalanceSet', {}) {}`,
        errors: [{ messageId: 'event', data: { name: 'BalanceSet' } }],
      },
      {
        code: `${header}export class PricesUpdated extends Domain.Event('PricesUpdated', {}) {}`,
        errors: [{ messageId: 'event', data: { name: 'PricesUpdated' } }],
      },
      {
        code: `${header}export class SetRoster extends Domain.Command('SetRoster', {}) {}`,
        errors: [{ messageId: 'command', data: { name: 'SetRoster' } }],
      },
      {
        code: `${header}export class UpdatePrices extends Domain.Command('UpdatePrices', {}) {}`,
        errors: [{ messageId: 'command', data: { name: 'UpdatePrices' } }],
      },
    ],
  },
);
