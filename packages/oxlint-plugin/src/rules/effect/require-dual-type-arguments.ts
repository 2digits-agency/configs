import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import type * as Fn from 'effect/Function';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isImportedApiIn } from '../../internal/scope';

// JavaScript has no syntax for type arguments.
const isTypeScriptFile = Schema.is(Schema.String.check(Schema.isPattern(/\.[cm]?tsx?$/u)));

export const requireDualTypeArguments = Rule.define({
  name: 'require-dual-type-arguments',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require Function.dual calls to pass their data-last and data-first signatures as type arguments.',
    messages: {
      missingTypeArguments:
        'Function.dual without type arguments does not type-check its implementation or its data-last form. Write Fn.dual<DataLast, DataFirst>(...) instead of annotating the constant.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!isTypeScriptFile(ctx.filename)) {
      return {};
    }

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Function', 'dual' satisfies keyof typeof Fn) &&
      isImportedApiIn(ctx.sourceCode, node.callee) &&
      P.isNullish(node.typeArguments)
        ? ctx.report(Diagnostic.fromId({ node: node.callee, messageId: 'missingTypeArguments' }))
        : Effect.void,
    );
  },
});
