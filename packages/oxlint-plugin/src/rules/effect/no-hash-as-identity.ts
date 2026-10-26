import type { ESTree, Rule } from '@oxlint/plugins';
import type * as Hash from 'effect/Hash';

import {
  argumentAt,
  defineEffectRule,
  isApi,
  isEqualityOperator,
  ruleMeta,
  staticPath,
  type FileState,
} from '../../utils';

const keyedMethods: ReadonlySet<string> = new Set(['delete', 'get', 'has', 'set']);

function isHashCall(node: ESTree.Node, state: FileState): node is ESTree.CallExpression {
  return node.type === 'CallExpression' && isApi(node.callee, state, 'Hash', 'hash' satisfies keyof typeof Hash);
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
        if (node.callee.type !== 'MemberExpression' || !keyedMethods.has(staticPath(node.callee)?.at(-1) ?? '')) {
          return;
        }

        const key = argumentAt(node, 0);

        if (key !== undefined && isHashValue(key)) {
          context.report({ node: key, messageId: 'hashIdentity' });
        }
      },
      BinaryExpression(node) {
        if (isEqualityOperator(node.operator) && isHashValue(node.left) && isHashValue(node.right)) {
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
