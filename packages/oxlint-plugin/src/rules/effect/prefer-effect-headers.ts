import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isGlobalIdentifier, ruleMeta } from '../../utils';

export const preferEffectHeaders: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer immutable Effect Headers values in Effect projects.',
    {
      effectHeaders: 'Use Headers.fromInput to construct normalized, immutable Effect headers.',
    },
    'https://www.effect.website/docs/v4/api/effect/unstable/http/Headers',
  ),
  (context, getState) => ({
    NewExpression(node) {
      if (getState().hasEffectImport && isGlobalIdentifier(node.callee, context, 'Headers')) {
        context.report({ node, messageId: 'effectHeaders' });
      }
    },
  }),
);
