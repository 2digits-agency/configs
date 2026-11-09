import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { ruleMeta } from '../../internal/meta';
import {
  discriminantFromComparison,
  isDiscriminantMember,
  isInsideBroadEffectHandler,
  isReasonTagMember,
} from './internal/tagged-values';

/**
 * Prefer tagged handlers to literal tag branching in broad Effect catch callbacks.
 */
export const noManualEffectErrorTag: CreateRule = Rule.define({
  name: 'no-manual-effect-error-tag',
  meta: ruleMeta({
    type: 'problem',
    description: 'Use Effect tagged error handlers instead of manually branching on `_tag` in a catch handler.',
    messages: {
      tag: 'Use Effect.catchTag or Effect.catchTags instead of manually discriminating a tagged error in a broad Effect catch handler.',
      reason:
        'Use Effect.catchReason or Effect.catchReasons instead of manually discriminating a tagged `reason` in a broad Effect catch handler.',
    },
    url: 'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-effect-error-tag.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    function report(node: ESTree.Node, tag: ESTree.MemberExpression) {
      return isInsideBroadEffectHandler(node)
        ? ctx.report(Diagnostic.fromId({ node, messageId: isReasonTagMember(tag) ? 'reason' : 'tag' }))
        : Effect.void;
    }

    return Visitor.merge(
      Visitor.on('BinaryExpression', (node) =>
        Opt.match(discriminantFromComparison(node), {
          onNone: () => Effect.void,
          onSome: (tag) => report(node, tag),
        }),
      ),
      Visitor.on('SwitchStatement', (node) =>
        isDiscriminantMember(node.discriminant) ? report(node, node.discriminant) : Effect.void,
      ),
    );
  },
});
