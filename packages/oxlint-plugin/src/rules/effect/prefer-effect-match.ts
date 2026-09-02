import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, ruleMeta } from '../../utils';

export const preferEffectMatch: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Match for composable and exhaustive branching in Effect projects.',
    {
      effectMatch: 'Use Match.type, Match.value, or Match.tags with Match.exhaustive instead of switch.',
    },
    'https://www.effect.website/docs/v4/api/effect/Match',
  ),
  (context, getState) => ({
    SwitchStatement(node) {
      if (getState().hasEffectImport) {
        context.report({ node, messageId: 'effectMatch' });
      }
    },
  }),
);
