import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, functionUsesFirstParameter, isApi, isFunctionNode, ruleMeta } from '../../utils';

export const preferWithSpan: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect.withSpan when the callback does not use the span handle.',
    {
      unusedSpan:
        'The useSpan callback ignores its span. Use Effect.withSpan so nested spans are parented beneath this span.',
    },
    'https://github.com/Effect-TS/tsgo/issues/663',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Effect', 'useSpan')) {
        return;
      }

      const callback = argumentAt(node, node.arguments.length - 1);

      if (callback !== undefined && isFunctionNode(callback) && !functionUsesFirstParameter(callback)) {
        context.report({ node, messageId: 'unusedSpan' });
      }
    },
  }),
);
