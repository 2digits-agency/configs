import { alchemyDomainRequireViewVersion } from '../../../src/rules/alchemy/alchemy-domain-require-view-version';
import { createRuleTester } from '../../rule-tester';

const header = `import * as Domain from '@alchemy.run/domain'`;

createRuleTester().run('alchemy-domain-require-view-version', alchemyDomainRequireViewVersion, {
  valid: [
    `${header}\nexport class Status extends Domain.View('Status', { ...shared, version: 2 }) {}`,
    `${header}\nexport class Status extends Domain.View('Status', { version: 0, from: [DailyImport] }) {}`,
    `${header}\nexport class Account extends Domain.Aggregate('Account', { id: AccountId }) {}`,
    `export class Status extends View('Status', { from: [DailyImport] }) {}`,
    `import { View } from '@alchemy.run/domain'\nexport function render(View) { return View('Status', { from: [] }) }`,
  ],
  invalid: [
    {
      code: `${header}\nexport class Status extends Domain.View('Status', { version: 2, ...shared }) {}`,
      errors: [{ messageId: 'overridden' }],
    },
    {
      code: `${header}\nexport class Status extends Domain.View('Status', { from: [DailyImport] } as const) {}`,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: `${header}\nexport class Status extends Domain.View('Status', { from: [DailyImport], evolve: {} }) {}`,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: `${header}\nexport class Status extends Domain.View('Status', { ...shared, from: [DailyImport] }) {}`,
      errors: [{ messageId: 'missing' }],
    },
  ],
});
