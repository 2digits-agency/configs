import type { ESTree, Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApi, ruleMeta, staticPath, type FileState } from '../../utils';

function isHashCall(node: ESTree.Node, state: FileState): node is ESTree.CallExpression {
  return node.type === 'CallExpression' && isApi(node.callee, state, 'Hash', 'hash');
}

export const noHashAsIdentity: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow using Hash.hash output as collision-free identity.',
    {
      hashIdentity:
        'Hash.hash is a bucketing hint, not a unique identity. Use HashMap/Equal.equals or a real identifier instead.',
    },
    'https://github.com/Effect-TS/tsgo/issues/482',
  ),
  (context, getState) => {
    let hashBindings = new Set<string>();

    function isHashValue(node: ESTree.Node): boolean {
      return isHashCall(node, getState()) || (node.type === 'Identifier' && hashBindings.has(node.name));
    }

    return {
      before() {
        hashBindings = new Set();
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && node.init && isHashCall(node.init, getState())) {
          hashBindings.add(node.id.name);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          !['delete', 'get', 'has', 'set'].includes(staticPath(node.callee)?.at(-1) ?? '')
        ) {
          return;
        }

        const key = argumentAt(node, 0);

        if (key !== undefined && isHashValue(key)) {
          context.report({ node: key, messageId: 'hashIdentity' });
        }
      },
      BinaryExpression(node) {
        if (['===', '!==', '==', '!='].includes(node.operator) && isHashValue(node.left) && isHashValue(node.right)) {
          context.report({ node, messageId: 'hashIdentity' });
        }
      },
      MemberExpression(node) {
        if (node.computed && isHashValue(node.property)) {
          context.report({ node: node.property, messageId: 'hashIdentity' });
        }
      },
    };
  },
);
