import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApi, isFunctionNode, ruleMeta } from '../../utils';

export const noFunctionConfigDefault: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow obsolete lazy callbacks passed to the now-eager Config.withDefault API.',
    {
      functionDefault:
        'Config.withDefault takes an eager value. This callback becomes the configured value; pass the returned value directly.',
    },
    'https://github.com/Effect-TS/tsgo/issues/408',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Config', 'withDefault')) {
        return;
      }

      const fallback = argumentAt(node, node.arguments.length - 1);

      if (fallback !== undefined && isFunctionNode(fallback) && fallback.params.length === 0) {
        context.report({ node: fallback, messageId: 'functionDefault' });
      }
    },
  }),
);
