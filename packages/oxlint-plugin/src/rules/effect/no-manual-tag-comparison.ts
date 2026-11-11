import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isStringLiteral, staticPropertyName } from '../../internal/ast';
import { argumentText, replaceWithNamespace } from '../../internal/fixes';
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
export const noManualTagComparison = Rule.define({
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
      isTagged: 'Replace with {{replacement}}.',
    },
    hasSuggestions: true,
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

    function diagnostic(node: ESTree.Node, member: ESTree.MemberExpression, kind: 'Comparison' | 'Switch') {
      return Diagnostic.fromId({
        node,
        messageId: isDiscriminantMember(member) ? `manual${kind}` : `manualDiscriminant${kind}`,
        data: { discriminant: Opt.getOrElse(staticPropertyName(member), () => '') },
      });
    }

    // A broad Effect catch handler belongs to `no-manual-effect-error-tag`, but only for `_tag`.
    function isOwnedElsewhere(node: ESTree.Node, member: ESTree.MemberExpression) {
      return isDiscriminantMember(member) && isInsideBroadEffectHandler(node);
    }

    /**
     * Report `x._tag === 'A'` with a suggestion for `P.isTagged(x, 'A')`, which narrows `x` in both branches. Only a
     * suggestion: it turns `x == null` into `false` instead of throwing, and an autofix would rewrite the `else if`
     * chains that prefer-effect-match reports before anyone sees that report.
     */
    const reportComparison = Effect.fnUntraced(function* (
      node: ESTree.BinaryExpression,
      member: ESTree.MemberExpression,
    ) {
      const base = diagnostic(node, member, 'Comparison');

      const literal = member === node.left ? node.right : node.left;

      if (
        !isDiscriminantMember(member) ||
        !isStringLiteral(literal) ||
        Arr.isReadonlyArrayNonEmpty(ctx.sourceCode.getCommentsInside(node))
      ) {
        return yield* ctx.report(base);
      }

      const negation = node.operator === '!==' || node.operator === '!=' ? '!' : '';

      const args = `${argumentText(ctx.sourceCode, member.object)}, ${ctx.sourceCode.getText(literal)}`;

      function call(namespace: string) {
        return `${negation}${namespace}.isTagged(${args})`;
      }

      const fix = yield* replaceWithNamespace(node, 'effect/Predicate', 'P', call);

      return yield* ctx.report(
        Diagnostic.withSuggestions(base, [{ messageId: 'isTagged', data: { replacement: call('P') }, fix }]),
      );
    });

    return Visitor.merge(
      Visitor.on('BinaryExpression', (node) =>
        Opt.match(discriminantFromComparison(node, discriminants), {
          onNone: () => Effect.void,
          onSome: (member) => (isOwnedElsewhere(node, member) ? Effect.void : reportComparison(node, member)),
        }),
      ),
      Visitor.on('SwitchStatement', (node) =>
        isDiscriminantMember(node.discriminant, discriminants)
          ? isOwnedElsewhere(node, node.discriminant)
            ? Effect.void
            : ctx.report(diagnostic(node, node.discriminant, 'Switch'))
          : Effect.void,
      ),
    );
  },
});
