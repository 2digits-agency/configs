import type { Scope, Variable } from '@typescript-eslint/scope-manager';
import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils';

type MessageId = 'preferInlineHandler';

const MEMO_HOOKS = new Set(['useCallback', 'useMemo']);

const componentBoundaryCache = new WeakMap<TSESTree.Node, TSESTree.Node | undefined>();

function getComponentBoundary(node: TSESTree.Node): TSESTree.Node | undefined {
  const cached = componentBoundaryCache.get(node);

  if (cached !== undefined) {
    return cached;
  }

  let current = node.parent;
  let result: TSESTree.Node | undefined;

  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration
      || current.type === AST_NODE_TYPES.FunctionExpression
      || current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      result = current;
      break;
    }
    current = current.parent;
  }

  componentBoundaryCache.set(node, result);

  return result;
}

function isWrappedInMemoHook(init: TSESTree.Expression): boolean {
  if (init.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const { callee } = init;

  if (callee.type === AST_NODE_TYPES.Identifier) {
    return MEMO_HOOKS.has(callee.name);
  }

  return false;
}

function findVariable(scope: Scope, name: string): Variable | undefined {
  let currentScope: Scope | null = scope;

  while (currentScope) {
    const found = currentScope.set.get(name);

    if (found) {
      return found;
    }
    currentScope = currentScope.upper;
  }

  return undefined;
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
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function reportIfSingleUse(
      identifier: TSESTree.Identifier,
      declarationNode: TSESTree.Node,
      handlerNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | TSESTree.FunctionDeclaration,
    ) {
      const scope = sourceCode.getScope(declarationNode);
      const variable = findVariable(scope, identifier.name);

      if (!variable) {
        return;
      }

      const reads = variable.references.filter((ref) => ref.isRead() && ref.identifier !== identifier);

      if (reads.length !== 1) {
        return;
      }

      const ref = reads[0];

      if (!ref) {
        return;
      }

      const refNode = ref.identifier;
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
      'VariableDeclarator[init.type=ArrowFunctionExpression], VariableDeclarator[init.type=FunctionExpression]':
        function (node: TSESTree.VariableDeclarator) {
          if (node.id.type !== AST_NODE_TYPES.Identifier) {
            return;
          }

          if (!node.init) {
            return;
          }

          if (!getComponentBoundary(node)) {
            return;
          }

          if (isWrappedInMemoHook(node.init)) {
            return;
          }

          const handlerNode = node.init as TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

          reportIfSingleUse(node.id, node, handlerNode);
        },

      'VariableDeclarator[init.type=CallExpression]': function (node: TSESTree.VariableDeclarator) {
        if (node.id.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        if (!getComponentBoundary(node)) {
          return;
        }

        if (isWrappedInMemoHook(node.init)) {
          return;
        }
      },

      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        if (!node.id) {
          return;
        }

        if (!getComponentBoundary(node)) {
          return;
        }

        reportIfSingleUse(node.id, node, node);
      },
    };
  },
});
