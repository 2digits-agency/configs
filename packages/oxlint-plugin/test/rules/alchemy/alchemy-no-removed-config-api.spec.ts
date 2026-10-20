import { testRule } from '../../rule-tester';

testRule('alchemy-no-removed-config-api', {
  valid: [
    `
    import * as Alchemy from 'alchemy'
    Alchemy.Stack('App', {}, program)
  `,
  ],
  invalid: [
    {
      code: `
    import * as Alchemy from 'alchemy'
    Alchemy.Secret('API_KEY')
  `,
      errors: [{ messageId: 'removed' }],
    },
  ],
});
