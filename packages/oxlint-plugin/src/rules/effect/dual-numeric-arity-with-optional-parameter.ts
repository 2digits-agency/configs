import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import type * as Fn from 'effect/Function';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import { argumentAt, isFunctionNode } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

function unsafeDualParameter(node: ESTree.ParamPattern): boolean {
  return (
    node.type === 'AssignmentPattern' ||
    node.type === 'RestElement' ||
    (node as { readonly optional?: boolean }).optional === true
  );
}

/**
 * The numeric arity literal of a `Function.dual` call whose implementation has an optional, default or rest parameter.
 *
 * @param node `Function.dual` call.
 */
function unsafeArity(node: ESTree.CallExpression): Opt.Option<ESTree.Expression> {
  return Opt.filter(
    argumentAt(node, 0),
    (arity) =>
      arity.type === 'Literal' &&
      P.isNumber(arity.value) &&
      Opt.exists(
        argumentAt(node, 1),
        (implementation) => isFunctionNode(implementation) && Arr.some(implementation.params, unsafeDualParameter),
      ),
  );
}

export const dualNumericArityWithOptionalParameter: CreateRule = defineRule({
  name: 'dual-numeric-arity-with-optional-parameter',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow numeric dual arity with optional or rest parameters because dispatch becomes ambiguous.',
    messages: {
      unsafeArity:
        'Function.dual with numeric arity misdispatches an implementation with optional/default/rest parameters. Use predicate dispatch.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/401',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Function', 'dual' satisfies keyof typeof Fn)
        ? Opt.match(unsafeArity(node), {
            onNone: () => Effect.void,
            onSome: (arity) => ctx.report(Diagnostic.fromId({ node: arity, messageId: 'unsafeArity' })),
          })
        : Effect.void,
    );
  },
});
