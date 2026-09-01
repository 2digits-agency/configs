import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApi, isFunctionNode, ruleMeta } from '../../utils';

export const noEmptyEffectCallback: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect.never to an empty Effect.callback registration.',
    {
      emptyCallback: 'An empty Effect.callback registration is Effect.never. Use the explicit primitive.',
    },
    'https://github.com/Effect-TS/tsgo/issues/636',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Effect', 'callback') && !isApi(node.callee, getState(), 'Effect', 'async')) {
        return;
      }

      const register = argumentAt(node, 0);

      if (
        register !== undefined &&
        isFunctionNode(register) &&
        register.body?.type === 'BlockStatement' &&
        register.body.body.length === 0
      ) {
        context.report({ node, messageId: 'emptyCallback' });
      }
    },
  }),
);
