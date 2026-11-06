import { AST_NODE_TYPES, ASTUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils';

type MessageId = 'preferInlineHandler';

function isInsideFunction(node: TSESTree.Node): boolean {
  for (let current = node.parent; current; current = current.parent) {
    if (ASTUtils.isFunction(current)) {
      return true;
    }
  }

  return false;
}

function getHandlerText(
  sourceCode: TSESLint.SourceCode,
  handlerNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration,
): string {
  if (handlerNode.type === AST_NODE_TYPES.FunctionDeclaration) {
    const params = handlerNode.params.map((p) => sourceCode.getText(p)).join(', ');

    const body = sourceCode.getText(handlerNode.body);

    const asyncPrefix = handlerNode.async ? 'async ' : '';

    return `${asyncPrefix}(${params}) => ${body}`;
  }

  return sourceCode.getText(handlerNode);
}

function getDeclarationStatement(node: TSESTree.Node): TSESTree.Node | undefined {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return node;
  }

  if (node.type === AST_NODE_TYPES.VariableDeclarator && node.parent.declarations.length === 1) {
    return node.parent;
  }

  return undefined;
}

export const RULE_NAME = 'prefer-inline-handlers';

export const preferInlineHandlers = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Discourage hoisting event handlers only used once in JSX; prefer inlining',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferInlineHandler: "Handler '{{name}}' is only used once as a JSX prop. Inline it where it's used.",
    },
    defaultOptions: [],
  },
  create(context) {
    const { sourceCode } = context;

    function reportIfSingleUse(
      identifier: TSESTree.Identifier,
      declarationNode: TSESTree.Node,
      handlerNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration,
    ) {
      // Look the name up among the declaration's own variables: a function's scope also holds its parameters.
      const variable = sourceCode
        .getDeclaredVariables(declarationNode)
        .find((declared) => declared.identifiers.includes(identifier));

      if (!variable) {
        return;
      }

      const reads = variable.references.filter((ref) => ref.isRead() && ref.identifier !== identifier);

      if (reads.length !== 1) {
        return;
      }

      const [ref] = reads;

      if (!ref) {
        return;
      }

      const { identifier: refNode } = ref;

      const { parent } = refNode;

      const isJsxPropValue =
        parent.type === AST_NODE_TYPES.JSXExpressionContainer && parent.parent.type === AST_NODE_TYPES.JSXAttribute;

      if (!isJsxPropValue) {
        return;
      }

      context.report({
        node: identifier,
        messageId: 'preferInlineHandler',
        data: { name: identifier.name },
        fix(fixer) {
          const handlerText = getHandlerText(sourceCode, handlerNode);

          const declarationStatement = getDeclarationStatement(declarationNode);

          const fixes: Array<TSESLint.RuleFix> = [fixer.replaceText(refNode, handlerText)];

          if (declarationStatement) {
            fixes.push(fixer.remove(declarationStatement));
          }

          return fixes;
        },
      });
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type !== AST_NODE_TYPES.Identifier || !ASTUtils.isFunction(node.init) || !isInsideFunction(node)) {
          return;
        }

        reportIfSingleUse(node.id, node, node.init);
      },

      FunctionDeclaration(node) {
        if (!node.id || !isInsideFunction(node)) {
          return;
        }

        reportIfSingleUse(node.id, node, node);
      },
    };
  },
});
