import type { Context, ESTree, Rule } from '@oxlint/plugins';

import { defineEffectRule, ruleMeta } from '../../utils';

const equalityOperators = new Set(['==', '===', '!=', '!==']);

function isLiteral(node: ESTree.Node): boolean {
  return node.type === 'Literal' || (node.type === 'TemplateLiteral' && node.expressions.length === 0);
}

function comparedValue(test: ESTree.Expression, context: Context): string | undefined {
  if (test.type !== 'BinaryExpression' || !equalityOperators.has(test.operator)) {
    return undefined;
  }

  if (isLiteral(test.left)) {
    return context.sourceCode.getText(test.right);
  }

  if (isLiteral(test.right)) {
    return context.sourceCode.getText(test.left);
  }

  return undefined;
}

/**
 * Prefer Match for switches in Effect files and repeated literal ternary comparisons.
 */
export const preferEffectMatch: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Match for composable and exhaustive branching in Effect projects.',
    {
      effectMatch: 'Use Match.type, Match.value, or Match.tags with Match.exhaustive instead of switch.',
      preferMatch: 'Use Match from Effect instead of a chained literal ternary.',
    },
    'https://www.effect.website/docs/v4/api/effect/Match',
  ),
  (context, getState) => ({
    SwitchStatement(node) {
      if (getState().hasEffectImport) {
        context.report({ node, messageId: 'effectMatch' });
      }
    },
    ConditionalExpression(node) {
      if (node.parent.type === 'ConditionalExpression') {
        return;
      }

      const value = comparedValue(node.test, context);

      if (value === undefined) {
        return;
      }

      let alternate = node.alternate;

      let literalChecks = 1;

      while (alternate.type === 'ConditionalExpression') {
        if (comparedValue(alternate.test, context) !== value) {
          return;
        }

        literalChecks += 1;

        alternate = alternate.alternate;
      }

      if (literalChecks > 1) {
        context.report({ node, messageId: 'preferMatch' });
      }
    },
  }),
);
