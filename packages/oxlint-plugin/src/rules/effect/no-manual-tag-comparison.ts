import type { ESTree, Rule } from '@oxlint/plugins';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { defineSyntaxRule, ruleMeta, staticPropertyName } from '../../utils';
import { discriminantFromComparison, isDiscriminantMember, isInsideBroadEffectHandler } from './tagged-values';

export interface NoManualTagComparisonOptions {
  /**
   * Discriminant properties checked in addition to `_tag`. Replaces the default `['kind', 'status']`.
   */
  readonly discriminants?: ReadonlyArray<string>;
}

// Oxlint validates options against `meta.schema`; the guard only narrows the JSON value.
const isOptions: (value: unknown) => value is NoManualTagComparisonOptions = Schema.is(
  Schema.Struct({ discriminants: Schema.Array(Schema.String).pipe(Schema.optionalKey) }),
);

/**
 * Prefer Match/Predicate helpers; broad catch handlers belong to the error-tag rule, which only knows `_tag`.
 */
export const noManualTagComparison: Rule = defineSyntaxRule(
  {
    ...ruleMeta(
      'problem',
      'Use Effect Match or Predicate helpers instead of manually branching on `_tag` or another configured discriminant.',
      {
        manualComparison:
          'Use Match.tag/Match.tags for tagged-value branching, or Predicate.isTagged for a simple reusable predicate.',
        manualSwitch:
          'Use Match.value(value).pipe(Match.tag/Match.tags/Match.tagsExhaustive) or the tagged enum `$match` helper instead of switching on `_tag`.',
        manualDiscriminantComparison:
          "Use Match.discriminator('{{discriminant}}')/Match.discriminators('{{discriminant}}') or a Match.when pattern instead of comparing `{{discriminant}}` manually.",
        manualDiscriminantSwitch:
          "Use Match.type or Match.value with Match.discriminatorsExhaustive('{{discriminant}}') instead of switching on `{{discriminant}}`.",
      },
      'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-tag-comparison.ts',
    ),
    schema: [
      {
        type: 'object',
        properties: {
          discriminants: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
            uniqueItems: true,
            description: 'Discriminant properties to check in addition to `_tag`. Replaces the default list.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ discriminants: ['kind', 'status'] } satisfies NoManualTagComparisonOptions],
  },
  (context) => {
    let discriminants: ReadonlySet<string> = new Set();

    function report(node: ESTree.Node, member: ESTree.MemberExpression, kind: 'Comparison' | 'Switch'): void {
      const isTag = isDiscriminantMember(member);

      // A broad Effect catch handler belongs to `no-manual-effect-error-tag`, but only for `_tag`.
      if (isTag && isInsideBroadEffectHandler(node)) {
        return;
      }

      context.report({
        node,
        messageId: isTag ? `manual${kind}` : `manualDiscriminant${kind}`,
        data: { discriminant: staticPropertyName(member) ?? '' },
      });
    }

    return {
      before() {
        const [options] = context.options;

        discriminants = new Set(['_tag', ...(isOptions(options) ? (options.discriminants ?? []) : [])]);
      },
      BinaryExpression(node) {
        const member = discriminantFromComparison(node, discriminants);

        if (P.isNotUndefined(member)) {
          report(node, member, 'Comparison');
        }
      },
      SwitchStatement(node) {
        if (isDiscriminantMember(node.discriminant, discriminants)) {
          report(node, node.discriminant, 'Switch');
        }
      },
    };
  },
);
