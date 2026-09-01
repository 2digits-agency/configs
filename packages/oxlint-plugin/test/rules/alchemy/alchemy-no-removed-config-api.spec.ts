import { alchemyNoRemovedConfigApi } from '../../../src/rules/alchemy/alchemy-no-removed-config-api';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-removed-config-api', alchemyNoRemovedConfigApi, {
  valid: `
    import * as Alchemy from 'alchemy'
    Alchemy.Stack('App', {}, program)
  `,
  invalid: `
    import * as Alchemy from 'alchemy'
    Alchemy.Secret('API_KEY')
  `,
  messageId: 'removed',
});
