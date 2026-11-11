import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { staticPropertyName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const NativeDateFormattingMethod = Schema.Literals(['toISOString', 'toLocaleDateString', 'toLocaleTimeString']);

const isNativeDateFormattingMethod = Schema.is(NativeDateFormattingMethod);

export const preferEffectDateTime = Rule.define({
  name: 'prefer-effect-datetime',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect DateTime formatting so time-zone behavior is explicit and composable.',
    messages: {
      effectDateTime:
        'Convert to DateTime and format it in an explicit zone: DateTime.setZone with DateTime.formatIsoDate, formatIsoOffset or formatIsoZoned, or DateTime.format with timeZone. DateTime.formatIso is UTC, like toISOString: use it only for UTC instants, never slice it for a local date.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/DateTime',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('CallExpression', (node) =>
      node.callee.type === 'MemberExpression' &&
      Opt.exists(staticPropertyName(node.callee), isNativeDateFormattingMethod)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'effectDateTime' }))
        : Effect.void,
    );
  },
});
