import { AST_NODE_TYPES, AST_TOKEN_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils';

type MessageId = 'missingCurly';

export const RULE_NAME = 'if-curly';

export const ifCurly = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require curly braces around if statement bodies',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingCurly: 'Expected curly braces around if statement body',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function getIndent(node: TSESTree.Node): string {
      const line = sourceCode.lines[node.loc.start.line - 1] ?? '';
      const match = line.match(/^(\s*)/);

      return match?.[1] ?? '';
    }

    function checkStatement(node: TSESTree.Statement, parent: TSESTree.IfStatement, isAlternate = false) {
      if (node.type === AST_NODE_TYPES.BlockStatement) {
        return;
      }

      const keywordToken = isAlternate
        ? sourceCode.getTokenBefore(node, (token) => token.type === AST_TOKEN_TYPES.Keyword && token.value === 'else')
        : sourceCode.getFirstToken(parent);

      context.report({
        node,
        loc: keywordToken?.loc ?? node.loc,
        messageId: 'missingCurly',
        fix(fixer) {
          const statementText = sourceCode.getText(node);
          const indent = getIndent(node);

          return fixer.replaceText(node, `{\n${indent}  ${statementText}\n${indent}}`);
        },
      });
    }

    return {
      IfStatement(node) {
        checkStatement(node.consequent, node, false);

        if (node.alternate && node.alternate.type !== AST_NODE_TYPES.IfStatement) {
          checkStatement(node.alternate, node, true);
        }
      },
    };
  },
});
