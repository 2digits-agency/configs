import type { Context, ESTree, Rule } from '@oxlint/plugins';

import {
  defineEffectRule,
  enclosingFunction,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
} from '../../utils';
import { callbackApi } from './utils';

const comparisonOperators: Readonly<Record<ESTree.LogicalExpression['operator'], ReadonlyArray<string>>> = {
  '&&': ['===', '=='],
  '||': ['!==', '!='],
  '??': [],
};

function chainOperands(node: ESTree.Expression, operator: string): ReadonlyArray<ESTree.Expression> {
  const expression = unwrapExpression(node);

  if (expression.type !== 'LogicalExpression' || expression.operator !== operator) {
    return [expression];
  }

  return [...chainOperands(expression.left, operator), ...chainOperands(expression.right, operator)];
}

// `a.x === b.x` yields the compared objects, ordered so `b.y === a.y` matches the same pair.
function comparedPair(node: ESTree.Expression, operators: ReadonlyArray<string>, context: Context): string | undefined {
  if (
    node.type !== 'BinaryExpression' ||
    !operators.includes(node.operator) ||
    node.left.type === 'PrivateIdentifier'
  ) {
    return undefined;
  }

  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  if (left.type !== 'MemberExpression' || right.type !== 'MemberExpression') {
    return undefined;
  }

  const field = staticPropertyName(left);

  const leftObject = context.sourceCode.getText(left.object);

  const rightObject = context.sourceCode.getText(right.object);

  if (field === undefined || leftObject === rightObject || field !== staticPropertyName(right)) {
    return undefined;
  }

  return leftObject < rightObject ? `${leftObject} and ${rightObject}` : `${rightObject} and ${leftObject}`;
}

// `Equivalence.make((a, b) => a.x === b.x && a.y === b.y)` already is the Effect way to compare fields.
function isEquivalenceDefinition(node: ESTree.Node, state: FileState): boolean {
  const callback = enclosingFunction(node);

  const api = callback === undefined ? undefined : callbackApi(callback, state);

  return api?.length === 2 && api[0] === 'Equivalence' && api[1] === 'make';
}

/**
 * Prefer Equal or an Equivalence over comparing two values field by field.
 */
export const preferEqual: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Equal.equals or an Equivalence over field-by-field comparisons in Effect files.',
    {
      preferEqual:
        'Compare {{pair}} with Equal.equals (Data and Schema classes implement Equal) or an Equivalence such as Equivalence.Struct instead of field by field.',
    },
    'https://www.effect.website/docs/v4/api/effect/Equal',
  ),
  (context, getState) => ({
    LogicalExpression(node) {
      const state = getState();

      const operators = comparisonOperators[node.operator];

      if (!state.hasEffectImport || operators.length === 0) {
        return;
      }

      const parent = node.parent;

      if (parent.type === 'LogicalExpression' && parent.operator === node.operator) {
        return;
      }

      const counts = new Map<string, number>();

      for (const operand of chainOperands(node, node.operator)) {
        const pair = comparedPair(operand, operators, context);

        if (pair === undefined) {
          continue;
        }

        const count = (counts.get(pair) ?? 0) + 1;

        counts.set(pair, count);

        if (count === 2 && !isEquivalenceDefinition(node, state)) {
          context.report({ node, messageId: 'preferEqual', data: { pair } });

          return;
        }
      }
    },
  }),
);
