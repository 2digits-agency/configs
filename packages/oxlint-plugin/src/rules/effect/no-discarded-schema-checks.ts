import type { ESTree, Rule } from '@oxlint/plugins';

import {
  defineEffectRule,
  isLiteral,
  objectProperty,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
} from '../../utils';

function methodCall(node: ESTree.Expression, method: string): ESTree.CallExpression | undefined {
  const expression = unwrapExpression(node);

  if (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'MemberExpression' &&
    staticPropertyName(expression.callee) === method
  ) {
    return expression;
  }

  return undefined;
}

export const noDiscardedSchemaChecks: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow schema mapping that silently drops checks attached to the receiver.',
    {
      discarded:
        '{{method}} creates a new schema and drops the preceding check. Re-attach the check after mapping or explicitly preserve it.',
    },
    'https://github.com/Effect-TS/tsgo/issues/435',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!getState().hasEffectImport || node.callee.type !== 'MemberExpression') {
        return;
      }

      const method = staticPropertyName(node.callee);

      if (method === undefined || !['mapElements', 'mapFields', 'mapMembers'].includes(method)) {
        return;
      }

      if (methodCall(node.callee.object, 'check') === undefined) {
        return;
      }

      const options = node.arguments.find((argument) => argument.type === 'ObjectExpression');
      const preserve =
        options?.type === 'ObjectExpression' ? objectProperty(options, 'unsafePreserveChecks') : undefined;

      if (preserve !== undefined && isLiteral(preserve.value, true)) {
        return;
      }

      context.report({ node, messageId: 'discarded', data: { method } });
    },
  }),
);
