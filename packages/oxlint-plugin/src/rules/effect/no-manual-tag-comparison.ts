import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { staticPropertyName } from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';
import { discriminantFromComparison, isDiscriminantMember, isInsideBroadEffectHandler } from './internal/tagged-values';

const Options = Schema.Struct({
  discriminants: Schema.Array(Schema.String)
    .annotate({
      description: "Discriminant properties checked in addition to `_tag`. Replaces the default `['kind', 'status']`.",
    })
    .pipe(Schema.optionalKey),
});

export type NoManualTagComparisonOptions = typeof Options.Type;

/**
 * Prefer Match/Predicate helpers; broad catch handlers belong to the error-tag rule, which only knows `_tag`.
 */
export const noManualTagComparison: CreateRule = Rule.define({
  name: 'no-manual-tag-comparison',
  meta: ruleMeta({
    type: 'problem',
    description:
      'Use Effect Match or Predicate helpers instead of manually branching on `_tag` or another configured discriminant.',
    messages: {
      manualComparison:
        'Use Match.tag/Match.tags for tagged-value branching, or Predicate.isTagged for a simple reusable predicate.',
      manualSwitch:
        'Use Match.value(value).pipe(Match.tag/Match.tags/Match.tagsExhaustive) or the tagged enum `$match` helper instead of switching on `_tag`.',
      manualDiscriminantComparison:
        "Use Match.discriminator('{{discriminant}}')/Match.discriminators('{{discriminant}}') or a Match.when pattern instead of comparing `{{discriminant}}` manually.",
      manualDiscriminantSwitch:
        "Use Match.type or Match.value with Match.discriminatorsExhaustive('{{discriminant}}') instead of switching on `{{discriminant}}`.",
    },
    url: 'https://github.com/dmmulroy/anti-slop/blob/main/src/effect/rules/no-manual-tag-comparison.ts',
    // Oxlint validates the options against this JSON Schema; the Effect Schema decodes them.
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
  }),
  options: Options.pipe(Schema.UndefinedOr),
  *create(options) {
    const ctx = yield* RuleContext;

    const discriminants: ReadonlySet<string> = new Set(['_tag', ...(options?.discriminants ?? [])]);

    function report(node: ESTree.Node, member: ESTree.MemberExpression, kind: 'Comparison' | 'Switch') {
      const isTag = isDiscriminantMember(member);

      // A broad Effect catch handler belongs to `no-manual-effect-error-tag`, but only for `_tag`.
      return isTag && isInsideBroadEffectHandler(node)
        ? Effect.void
        : ctx.report(
            Diagnostic.fromId({
              node,
              messageId: isTag ? `manual${kind}` : `manualDiscriminant${kind}`,
              data: { discriminant: Opt.getOrElse(staticPropertyName(member), () => '') },
            }),
          );
    }

    return Visitor.merge(
      Visitor.on('BinaryExpression', (node) =>
        Opt.match(discriminantFromComparison(node, discriminants), {
          onNone: () => Effect.void,
          onSome: (member) => report(node, member, 'Comparison'),
        }),
      ),
      Visitor.on('SwitchStatement', (node) =>
        isDiscriminantMember(node.discriminant, discriminants)
          ? report(node, node.discriminant, 'Switch')
          : Effect.void,
      ),
    );
  },
});
