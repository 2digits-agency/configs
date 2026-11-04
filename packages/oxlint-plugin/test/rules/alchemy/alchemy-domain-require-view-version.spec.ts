import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { alchemyDomainRequireViewVersion } from '../../../src/rules/alchemy/alchemy-domain-require-view-version';

RuleTester.describe = describe;

RuleTester.it = it;

const header = `import * as Domain from '@alchemy.run/domain'`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'alchemy-domain-require-view-version',
  alchemyDomainRequireViewVersion,
  {
    valid: [
      `${header}\nexport class Status extends Domain.View('Status', { version: 0, from: [DailyImport] }) {}`,
      `${header}\nexport class Account extends Domain.Aggregate('Account', { id: AccountId }) {}`,
      `export class Status extends View('Status', { from: [DailyImport] }) {}`,
      `import { View } from '@alchemy.run/domain'\nexport function render(View) { return View('Status', { from: [] }) }`,
    ],
    invalid: [
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
  },
);
