import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, functionUsesFirstParameter, isApi, isFunctionNode, ruleMeta } from '../../utils';

export const preferUninterruptible: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer the non-mask interruptibility API when the restore callback is unused.',
    {
      unusedRestore:
        'The mask callback never uses restore, so the mask is equivalent to {{replacement}} and misleadingly suggests a restored region.',
    },
    'https://github.com/Effect-TS/tsgo/issues/659',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();
      const method = isApi(node.callee, state, 'Effect', 'uninterruptibleMask')
        ? 'uninterruptible'
        : isApi(node.callee, state, 'Effect', 'interruptibleMask')
          ? 'interruptible'
          : undefined;
      const callback = argumentAt(node, 0);

      if (
        method !== undefined &&
        callback !== undefined &&
        isFunctionNode(callback) &&
        !functionUsesFirstParameter(callback)
      ) {
        context.report({
          node,
          messageId: 'unusedRestore',
          data: { replacement: `Effect.${method}` },
        });
      }
    },
  }),
);
