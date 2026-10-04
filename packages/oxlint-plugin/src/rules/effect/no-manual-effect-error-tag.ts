import type { Rule } from '@oxlint/plugins';

import { defineSyntaxRule, ruleMeta } from '../../utils';
import { isInsideBroadEffectHandler, isReasonTagMember, isTagMember, tagMemberFromComparison } from './tagged-values';

/**
 * Prefer tagged handlers to literal tag branching in broad Effect catch callbacks.
 */
export const noManualEffectErrorTag: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Use Effect tagged error handlers instead of manually branching on `_tag` in a catch handler.',
    {
      tag: 'Use Effect.catchTag or Effect.catchTags instead of manually discriminating a tagged error in a broad Effect catch handler.',
      reason:
        'Use Effect.catchReason or Effect.catchReasons instead of manually discriminating a tagged `reason` in a broad Effect catch handler.',
    },
    'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-effect-error-tag.ts',
  ),
  (context) => ({
    BinaryExpression(node) {
      const tag = tagMemberFromComparison(node);

      if (tag === undefined || !isInsideBroadEffectHandler(node)) {
        return;
      }

      context.report({ node, messageId: isReasonTagMember(tag) ? 'reason' : 'tag' });
    },
    SwitchStatement(node) {
      if (!isTagMember(node.discriminant) || !isInsideBroadEffectHandler(node)) {
        return;
      }

      context.report({ node, messageId: isReasonTagMember(node.discriminant) ? 'reason' : 'tag' });
    },
  }),
);
