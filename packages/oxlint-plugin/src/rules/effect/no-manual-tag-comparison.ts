import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';
import { isInsideBroadEffectHandler, isTagMember, tagMemberFromComparison } from './tagged-values';

/**
 * Prefer Match/Predicate helpers; broad catch handlers belong to the error-tag rule.
 */
export const noManualTagComparison: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Use Effect Match or Predicate helpers instead of manually branching on `_tag`.',
    {
      manualComparison:
        'Use Match.tag/Match.tags for tagged-value branching, or Predicate.isTagged for a simple reusable predicate.',
      manualSwitch:
        'Use Match.value(value).pipe(Match.tag/Match.tags/Match.tagsExhaustive) or the tagged enum `$match` helper instead of switching on `_tag`.',
    },
    'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-tag-comparison.ts',
  ),
  (context) => ({
    BinaryExpression(node) {
      if (tagMemberFromComparison(node) === undefined || isInsideBroadEffectHandler(node)) {
        return;
      }

      context.report({ node, messageId: 'manualComparison' });
    },
    SwitchStatement(node) {
      if (!isTagMember(node.discriminant) || isInsideBroadEffectHandler(node)) {
        return;
      }

      context.report({ node, messageId: 'manualSwitch' });
    },
  }),
);
