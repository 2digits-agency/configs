import type { Context, ESTree, Rule } from '@oxlint/plugins';

import { defineEffectRule, isEqualityOperator, ruleMeta } from '../../utils';

function isStaticLiteral(node: ESTree.Node): boolean {
  return node.type === 'Literal' || (node.type === 'TemplateLiteral' && node.expressions.length === 0);
}

function comparedValue(test: ESTree.Expression, context: Context): string | undefined {
  if (test.type !== 'BinaryExpression' || !isEqualityOperator(test.operator)) {
    return undefined;
  }

  if (isStaticLiteral(test.left)) {
    return context.sourceCode.getText(test.right);
  }

  if (isStaticLiteral(test.right)) {
    return context.sourceCode.getText(test.left);
  }

  return undefined;
}

/**
 * Whether every test in a ternary or `else if` chain compares the same expression against a literal, at least twice.
 *
 * @param node Head of the chain.
 * @param context Rule context.
 */
function isLiteralComparisonChain(node: ESTree.ConditionalExpression | ESTree.IfStatement, context: Context): boolean {
  const value = comparedValue(node.test, context);

  if (value === undefined) {
    return false;
  }

  let next: ESTree.Node | null = node.alternate;

  let literalChecks = 1;

  while (next?.type === 'ConditionalExpression' || next?.type === 'IfStatement') {
    if (comparedValue(next.test, context) !== value) {
      return false;
    }

    literalChecks += 1;

    next = next.alternate;
  }

  return literalChecks > 1;
}

/**
 * Prefer Match for switches and `else if` chains in Effect files, and for repeated literal ternary comparisons.
 */
export const preferEffectMatch: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Match for composable and exhaustive branching in Effect projects.',
    {
      effectMatch: 'Use Match.type, Match.value, or Match.tags with Match.exhaustive instead of switch.',
      preferMatch: 'Use Match from Effect instead of a chained literal ternary.',
      ifChain:
        'Use Match.type, Match.value, or Match.discriminators with Match.exhaustive instead of an `else if` chain comparing the same value against literals.',
    },
    'https://www.effect.website/docs/v4/api/effect/Match',
  ),
  (context, getState) => ({
    SwitchStatement(node) {
      if (getState().hasEffectImport) {
        context.report({ node, messageId: 'effectMatch' });
      }
    },
    IfStatement(node) {
      if (node.parent.type === 'IfStatement' && node.parent.alternate === node) {
        return;
      }

      if (getState().hasEffectImport && isLiteralComparisonChain(node, context)) {
        context.report({ node, messageId: 'ifChain' });
      }
    },
    ConditionalExpression(node) {
      if (node.parent.type !== 'ConditionalExpression' && isLiteralComparisonChain(node, context)) {
        context.report({ node, messageId: 'preferMatch' });
      }
    },
  }),
);
