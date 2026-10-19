import { testRule } from '../../rule-tester';

testRule('alchemy-no-v1-import', {
  valid: [`import * as Alchemy from 'alchemy'`],
  invalid: [{ code: `import alchemy from 'alchemy'`, errors: [{ messageId: 'defaultImport' }] }],
});
