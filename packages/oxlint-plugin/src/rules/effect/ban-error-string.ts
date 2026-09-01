import type { ESTree, Rule } from '@oxlint/plugins';

import { argumentAt, defineSyntaxRule, isErrorConstructor, ruleMeta, staticPath } from '../../utils';

const errorLikeNames = new Set(['error', 'err', 'e', 'cause', 'exception', 'ex']);

function errorLikeName(node: ESTree.Node | undefined): string | undefined {
  return node?.type === 'Identifier' && errorLikeNames.has(node.name) ? node.name : undefined;
}

function isStringCall(node: ESTree.CallExpression): boolean;
function isStringCall(node: ESTree.Node): node is ESTree.CallExpression;
function isStringCall(node: ESTree.Node): boolean {
  if (node.type !== 'CallExpression' || node.arguments.length !== 1) {
    return false;
  }

  const path = staticPath(node.callee);

  return path?.at(-1) === 'String' && path.length <= 2;
}

export const banErrorString: Rule = defineSyntaxRule(
  {
    ...ruleMeta('problem', 'Disallow string coercion that discards an error value’s stack, type, and cause chain.', {
      errorString: 'Do not stringify {{name}}. Preserve the original error as an Error cause instead.',
      useCause: 'Replace {{pattern}} with {{replacement}} to preserve the original error.',
    }),
    hasSuggestions: true,
  },
  (context) => ({
    NewExpression(node) {
      const firstArgument = argumentAt(node, 0);

      if (firstArgument === undefined || !isStringCall(firstArgument) || !isErrorConstructor(node)) {
        return;
      }

      const causeArgument = argumentAt(firstArgument, 0);

      if (causeArgument === undefined) {
        return;
      }

      const cause = context.sourceCode.getText(causeArgument);
      const replacement = `'Error occurred', { cause: ${cause} }`;

      context.report({
        node: firstArgument,
        messageId: 'errorString',
        data: { name: cause },
        suggest: [
          {
            messageId: 'useCause',
            data: { pattern: context.sourceCode.getText(firstArgument), replacement },
            fix: (fixer) => fixer.replaceText(firstArgument, replacement),
          },
        ],
      });
    },
    CallExpression(node) {
      if (isStringCall(node)) {
        if (
          node.parent.type === 'NewExpression' &&
          node.parent.arguments[0] === node &&
          isErrorConstructor(node.parent)
        ) {
          return;
        }

        const name = errorLikeName(node.arguments[0]);

        if (name !== undefined) {
          context.report({ node, messageId: 'errorString', data: { name } });
        }

        return;
      }

      if (
        node.callee.type === 'MemberExpression' &&
        staticPath(node.callee)?.at(-1) === 'toString' &&
        node.arguments.length === 0
      ) {
        const name = errorLikeName(node.callee.object);

        if (name !== undefined) {
          context.report({ node, messageId: 'errorString', data: { name } });
        }
      }
    },
    TemplateLiteral(node) {
      const [first, last] = node.quasis;
      const name = errorLikeName(node.expressions[0]);

      if (name !== undefined && node.quasis.length === 2 && first?.value.raw === '' && last?.value.raw === '') {
        context.report({ node, messageId: 'errorString', data: { name } });
      }
    },
  }),
);
