import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Fn from 'effect/Function';
import * as P from 'effect/Predicate';

import { argumentAt, defineEffectRule, isApi, isFunctionNode, ruleMeta } from '../../utils';

function unsafeDualParameter(node: ESTree.ParamPattern): boolean {
  return (
    node.type === 'AssignmentPattern' ||
    node.type === 'RestElement' ||
    (node as { readonly optional?: boolean }).optional === true
  );
}

export const dualNumericArityWithOptionalParameter: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow numeric dual arity with optional or rest parameters because dispatch becomes ambiguous.',
    {
      unsafeArity:
        'Function.dual with numeric arity misdispatches an implementation with optional/default/rest parameters. Use predicate dispatch.',
    },
    'https://github.com/Effect-TS/tsgo/issues/401',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const arity = argumentAt(node, 0);

      const implementation = argumentAt(node, 1);

      if (
        implementation === undefined ||
        !isApi(node.callee, getState(), 'Function', 'dual' satisfies keyof typeof Fn) ||
        arity?.type !== 'Literal' ||
        !P.isNumber(arity.value) ||
        !isFunctionNode(implementation)
      ) {
        return;
      }

      if (Arr.some(implementation.params, unsafeDualParameter)) {
        context.report({ node: arity, messageId: 'unsafeArity' });
      }
    },
  }),
);
