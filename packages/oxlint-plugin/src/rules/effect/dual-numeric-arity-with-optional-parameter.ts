import type { ESTree, Rule } from '@oxlint/plugins';

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
        !isApi(node.callee, getState(), 'Function', 'dual') ||
        arity?.type !== 'Literal' ||
        typeof arity.value !== 'number' ||
        !isFunctionNode(implementation)
      ) {
        return;
      }

      if (implementation.params.some((parameter) => unsafeDualParameter(parameter))) {
        context.report({ node: arity, messageId: 'unsafeArity' });
      }
    },
  }),
);
