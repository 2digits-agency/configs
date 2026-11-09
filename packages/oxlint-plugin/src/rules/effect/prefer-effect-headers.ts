import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isGlobalIdentifier } from '../../internal/scope';

export const preferEffectHeaders: CreateRule = defineRule({
  name: 'prefer-effect-headers',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer immutable Effect Headers values in Effect projects.',
    messages: { effectHeaders: 'Use Headers.fromInput to construct normalized, immutable Effect headers.' },
    url: 'https://www.effect.website/docs/v4/api/effect/unstable/http/Headers',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('NewExpression', (node) =>
      Effect.when(
        ctx.report(Diagnostic.fromId({ node, messageId: 'effectHeaders' })),
        isGlobalIdentifier(node.callee, 'Headers'),
      ),
    );
  },
});
