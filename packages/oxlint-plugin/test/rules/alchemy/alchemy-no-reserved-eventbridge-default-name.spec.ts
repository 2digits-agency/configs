import { alchemyNoReservedEventbridgeDefaultName } from '../../../src/rules/alchemy/alchemy-no-reserved-eventbridge-default-name';
import { testRule } from '../../rule-tester';

testRule('alchemy-no-reserved-eventbridge-default-name', alchemyNoReservedEventbridgeDefaultName, {
  valid: `
    import * as AWS from 'alchemy/AWS'
    AWS.EventBridge.EventBus('Bus', { name: 'application-events' })
  `,
  invalid: `
    import * as AWS from 'alchemy/AWS'
    AWS.EventBridge.EventBus('Bus', { name: 'default' })
  `,
  messageId: 'reserved',
});
