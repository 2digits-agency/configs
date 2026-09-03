import { alchemyNoV1Import } from '../../../src/rules/alchemy/alchemy-no-v1-import';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-v1-import', alchemyNoV1Import, {
  valid: `import * as Alchemy from 'alchemy'`,
  invalid: `import alchemy from 'alchemy'`,
  messageId: 'defaultImport',
});
