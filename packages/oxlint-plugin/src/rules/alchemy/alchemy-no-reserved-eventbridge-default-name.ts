import type { Rule } from '@oxlint/plugins';
import type * as EventBridge from 'alchemy/AWS/EventBridge';

import { argumentAt, defineEffectRule, isApiPath, isLiteral, objectProperty, ruleMeta } from '../../utils';

export const alchemyNoReservedEventbridgeDefaultName: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow creating an EventBridge bus with the reserved default name.',
    {
      reserved:
        'EventBridge reserves the name "default". Omit the bus argument to use the account default, or choose another name.',
    },
    'https://alchemy.run/aws/messaging/eventbridge',
  ),
  (context, getState) => ({
    CallExpression(node) {
      // `alchemy/AWS` exports `alchemy/AWS/EventBridge` as `EventBridge`; the submodule is much cheaper to type check.
      if (!isApiPath(node.callee, getState(), ['AWS', 'EventBridge', 'EventBus' satisfies keyof typeof EventBridge])) {
        return;
      }

      const options = argumentAt(node, 1);

      const name = options?.type === 'ObjectExpression' ? objectProperty(options, 'name') : undefined;

      if (name !== undefined && isLiteral(name.value, 'default')) {
        context.report({ node: name.value, messageId: 'reserved' });
      }
    },
  }),
);
