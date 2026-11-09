import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import type * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { namespaceImport } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { durationArgument, numericValue } from './internal/duration';

export const preferEffectDuration: CreateRule = defineRule({
  name: 'prefer-effect-duration',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer explicit Effect Duration constructors over ambiguous millisecond literals.',
    messages: {
      effectDuration: 'Wrap this number with Duration.millis or use a more descriptive Duration constructor.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Duration',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const report = Effect.fnUntraced(function* (node: ESTree.CallExpression, duration: ESTree.Expression) {
      const imported = yield* namespaceImport(node, 'effect/Duration', 'Duration');

      const wrap = Diagnostic.replaceText(
        duration,
        `${imported.name}.${'millis' satisfies keyof typeof Duration}(${ctx.sourceCode.getText(duration)})`,
      );

      yield* ctx.report(
        Diagnostic.withFix(
          Diagnostic.fromId({ node: duration, messageId: 'effectDuration' }),
          Diagnostic.composeFixes(...Opt.toArray(imported.fix), wrap),
        ),
      );
    });

    return Visitor.on('CallExpression', (node) =>
      Effect.flatMap(durationArgument(node, imports), (duration) =>
        Opt.match(
          Opt.filter(duration, (expression) => Opt.isSome(numericValue(expression))),
          {
            onNone: () => Effect.void,
            onSome: (expression) => report(node, expression),
          },
        ),
      ),
    );
  },
});
