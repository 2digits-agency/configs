import type { Context, ESTree, Rule } from '@oxlint/plugins';

import {
  argumentAt,
  defineEffectRule,
  firstIdentifierParameter,
  isApi,
  ruleMeta,
  type FileState,
  type FunctionNode,
} from '../../utils';
import { functionResult } from './utils';

function resultBranch(node: ESTree.Expression, state: FileState, member: string): ESTree.Expression | undefined {
  return node.type === 'CallExpression' && isApi(node.callee, state, 'Result', member)
    ? argumentAt(node, 0)
    : undefined;
}

function checkFilter(context: Context, node: FunctionNode, state: FileState): void {
  const parameter = firstIdentifierParameter(node);
  const result = functionResult(node);

  if (parameter === undefined || result?.type !== 'ConditionalExpression') {
    return;
  }

  const success = resultBranch(result.consequent, state, 'succeed');
  const failure = resultBranch(result.alternate, state, 'fail');

  if (
    success?.type === 'Identifier' &&
    success.name === parameter.name &&
    failure?.type === 'Identifier' &&
    failure.name === parameter.name
  ) {
    context.report({ node, messageId: 'effectFilter' });
  }
}

export const preferEffectFilter: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Filter constructors for reusable Result-valued predicates.',
    {
      effectFilter: 'Use Filter.fromPredicate for this Result-valued predicate so it composes as a Filter.',
    },
    'https://www.effect.website/docs/v4/api/effect/Filter',
  ),
  (context, getState) => ({
    ArrowFunctionExpression(node) {
      checkFilter(context, node, getState());
    },
    FunctionExpression(node) {
      checkFilter(context, node, getState());
    },
  }),
);
