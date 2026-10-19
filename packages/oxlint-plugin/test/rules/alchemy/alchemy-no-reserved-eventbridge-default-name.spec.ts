import { testRule } from '../../rule-tester';

testRule('alchemy-no-reserved-eventbridge-default-name', {
  valid: [
    `
    import * as AWS from 'alchemy/AWS'
    AWS.EventBridge.EventBus('Bus', { name: 'application-events' })
  `,
  ],
  invalid: [
    {
      code: `
    import * as AWS from 'alchemy/AWS'
    AWS.EventBridge.EventBus('Bus', { name: 'default' })
  `,
      errors: [{ messageId: 'reserved' }],
    },
  ],
});
