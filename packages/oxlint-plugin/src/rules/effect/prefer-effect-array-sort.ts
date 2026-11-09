import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import type * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { staticPropertyName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

export const preferEffectArraySort: CreateRule = Rule.define({
  name: 'prefer-effect-array-sort',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer immutable, Order-based Effect Array sorting in Effect projects.',
    messages: { effectArraySort: 'Use Arr.sort with an Order instead of the mutable native Array.sort method.' },
    url: 'https://www.effect.website/docs/v4/api/effect/Array#sort',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('CallExpression', (node) =>
      node.callee.type === 'MemberExpression' &&
      Opt.contains(staticPropertyName(node.callee), 'sort') &&
      !imports.isApi(node.callee, 'Array', 'sort' satisfies keyof typeof Arr)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'effectArraySort' }))
        : Effect.void,
    );
  },
});
