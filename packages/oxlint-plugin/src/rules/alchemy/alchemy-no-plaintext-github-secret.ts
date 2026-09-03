import type { ESTree, Rule } from '@oxlint/plugins';

import {
  argumentAt,
  defineEffectRule,
  isApi,
  objectProperty,
  ruleMeta,
  staticPath,
  unwrapExpression,
} from '../../utils';

function isPlaintextSecret(node: ESTree.Expression, state: Parameters<typeof isApi>[1]): boolean {
  const value = unwrapExpression(node);

  if ((value.type === 'Literal' && typeof value.value === 'string') || value.type === 'TemplateLiteral') {
    return true;
  }

  const path = staticPath(value);

  if (path?.[0] === 'process' && path[1] === 'env') {
    return true;
  }

  return value.type === 'CallExpression' && isApi(value.callee, state, 'Config', 'string');
}

export const alchemyNoPlaintextGithubSecret: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Require singular GitHub Secret values to use Redacted.',
    {
      plaintext:
        'GitHub.Secret value must be Redacted so it stays out of logs and state. Use Redacted.make(...) or Config.redacted(...).',
    },
    'https://alchemy.run/providers/github/secret',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (!isApi(node.callee, state, 'GitHub', 'Secret')) {
        return;
      }

      const options = argumentAt(node, 1);
      const value = options?.type === 'ObjectExpression' ? objectProperty(options, 'value') : undefined;

      if (value !== undefined && isPlaintextSecret(value.value, state)) {
        context.report({ node: value.value, messageId: 'plaintext' });
      }
    },
  }),
);
