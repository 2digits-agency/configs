import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isApi, ruleMeta, staticPropertyName } from '../../utils';

export const preferEffectArraySort: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer immutable, Order-based Effect Array sorting in Effect projects.',
    {
      effectArraySort: 'Use Arr.sort with an Order instead of the mutable native Array.sort method.',
    },
    'https://www.effect.website/docs/v4/api/effect/Array#sort',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (
        state.hasEffectImport &&
        node.callee.type === 'MemberExpression' &&
        staticPropertyName(node.callee) === 'sort' &&
        !isApi(node.callee, state, 'Array', 'sort')
      ) {
        context.report({ node, messageId: 'effectArraySort' });
      }
    },
  }),
);
