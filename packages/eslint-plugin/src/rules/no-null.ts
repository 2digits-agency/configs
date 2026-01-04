import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

import { createRule } from '../utils';

type MessageId = (typeof MessageId)[keyof typeof MessageId];
const MessageId = {
  noNull: 'noNull',
  suggestUndefined: 'suggestUndefined',
} as const;

export const RULE_NAME = 'no-null';

type ParserServices = ReturnType<typeof ESLintUtils.getParserServices>;

function typeRequiresNull(type: ts.Type): boolean {
  if (type.isUnion()) {
    let hasNull = false;
    let hasUndefined = false;

    for (const t of type.types) {
      if (t.flags & ts.TypeFlags.Null) {
        hasNull = true;
      }

      if (t.flags & ts.TypeFlags.Undefined) {
        hasUndefined = true;
      }
    }

    return hasNull && !hasUndefined;
  }

  return (type.flags & ts.TypeFlags.Null) !== 0;
}

function isExternalDeclaration(decl: ts.Declaration, program: ts.Program): boolean {
  // TS types say getSourceFile() always returns SourceFile, but intrinsic signatures can have undefined
  const sourceFile = (decl as { getSourceFile?: () => ts.SourceFile }).getSourceFile?.();

  if (!sourceFile) {
    return false;
  }

  return program.isSourceFileFromExternalLibrary(sourceFile) || program.isSourceFileDefaultLibrary(sourceFile);
}

function isTypeFromExternal(type: ts.Type, program: ts.Program): boolean {
  const symbol = type.getSymbol() ?? type.aliasSymbol;

  if (!symbol) {
    return false;
  }

  const declarations = symbol.getDeclarations();

  if (!declarations || declarations.length === 0) {
    return false;
  }

  return declarations.some((decl) => isExternalDeclaration(decl, program));
}

function checkVariableDeclarator(
  parent: TSESTree.VariableDeclarator,
  checker: ts.TypeChecker,
  program: ts.Program,
  parserServices: ParserServices,
): boolean {
  const tsNode = parserServices.esTreeNodeToTSNodeMap.get(parent) as ts.VariableDeclaration | undefined;

  if (!tsNode?.type) {
    return false;
  }

  const type = checker.getTypeFromTypeNode(tsNode.type);

  return typeRequiresNull(type) && isTypeFromExternal(type, program);
}

function checkAssignment(
  parent: TSESTree.AssignmentExpression,
  checker: ts.TypeChecker,
  program: ts.Program,
  parserServices: ParserServices,
): boolean {
  const tsLeft = parserServices.esTreeNodeToTSNodeMap.get(parent.left);
  const type = checker.getTypeAtLocation(tsLeft);

  return typeRequiresNull(type) && isTypeFromExternal(type, program);
}

function assignmentTargetRequiresNull(
  node: TSESTree.Literal,
  checker: ts.TypeChecker,
  program: ts.Program,
  parserServices: ParserServices,
): boolean {
  const parent = node.parent;

  if (parent.type === AST_NODE_TYPES.VariableDeclarator && parent.init === node) {
    return checkVariableDeclarator(parent, checker, program, parserServices);
  }

  if (parent.type === AST_NODE_TYPES.AssignmentExpression && parent.right === node) {
    return checkAssignment(parent, checker, program, parserServices);
  }

  return false;
}

function argumentRequiresNull(
  node: TSESTree.Literal,
  checker: ts.TypeChecker,
  program: ts.Program,
  parserServices: ParserServices,
): boolean {
  const parent = node.parent;

  if (parent.type !== AST_NODE_TYPES.CallExpression && parent.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }

  const argIndex = parent.arguments.indexOf(node as TSESTree.CallExpressionArgument);

  if (argIndex === -1) {
    return false;
  }

  const tsCall = parserServices.esTreeNodeToTSNodeMap.get(parent) as ts.CallExpression | ts.NewExpression | undefined;

  if (!tsCall) {
    return false;
  }

  const signature = checker.getResolvedSignature(tsCall);

  if (!signature) {
    return false;
  }

  const signatureDecl = signature.getDeclaration() as ts.SignatureDeclaration | undefined;

  if (!signatureDecl || !isExternalDeclaration(signatureDecl, program)) {
    return false;
  }

  const params = signature.getParameters();
  const param = params[argIndex];

  if (!param) {
    return false;
  }

  const paramType = checker.getTypeOfSymbol(param);

  return typeRequiresNull(paramType);
}

function isAllowedPattern(node: TSESTree.Literal): boolean {
  const parent = node.parent;

  if (parent.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const { callee } = parent;

  if (
    callee.type === AST_NODE_TYPES.MemberExpression
    && callee.object.type === AST_NODE_TYPES.Identifier
    && callee.object.name === 'Object'
    && callee.property.type === AST_NODE_TYPES.Identifier
    && callee.property.name === 'create'
    && parent.arguments[0] === node
  ) {
    return true;
  }

  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'useRef' && parent.arguments[0] === node) {
    return true;
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression
    && callee.property.type === AST_NODE_TYPES.Identifier
    && callee.property.name === 'useRef'
    && parent.arguments[0] === node
  ) {
    return true;
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression
    && callee.property.type === AST_NODE_TYPES.Identifier
    && callee.property.name === 'insertBefore'
    && parent.arguments[1] === node
  ) {
    return true;
  }

  return false;
}

function isLooseEquality(node: TSESTree.Literal): boolean {
  const parent = node.parent;

  return parent.type === AST_NODE_TYPES.BinaryExpression && (parent.operator === '==' || parent.operator === '!=');
}

function isStrictEquality(node: TSESTree.Literal): boolean {
  const parent = node.parent;

  return parent.type === AST_NODE_TYPES.BinaryExpression && (parent.operator === '===' || parent.operator === '!==');
}

function canRemoveReturnValue(node: TSESTree.Literal): node is TSESTree.Literal & { parent: TSESTree.ReturnStatement } {
  const parent = node.parent;

  return parent.type === AST_NODE_TYPES.ReturnStatement && parent.argument === node;
}

function canRemoveInitializer(node: TSESTree.Literal): TSESTree.VariableDeclaratorMaybeInit | undefined {
  const parent = node.parent;

  if (parent.type !== AST_NODE_TYPES.VariableDeclarator || parent.init !== node) {
    return;
  }

  const grandparent = parent.parent;

  if (grandparent.kind === 'const') {
    return;
  }

  return parent;
}

function isNullLiteral(node: TSESTree.Literal): node is TSESTree.NullLiteral {
  return node.raw === 'null';
}

export const noNull = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow the use of `null` except when required by external types',
    },
    fixable: 'code',
    hasSuggestions: true,
    schema: [],
    messages: {
      noNull: 'Prefer `undefined` over `null`. Use `null` only when required by external APIs.',
      suggestUndefined: 'Replace `null` with `undefined`',
    },
  },
  defaultOptions: [],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context, true);

    const hasTypeInfo = parserServices.program && 'getTypeAtLocation' in parserServices;

    const checker = hasTypeInfo ? parserServices.program.getTypeChecker() : undefined;
    const program = hasTypeInfo ? parserServices.program : undefined;

    return {
      Literal(node) {
        if (!isNullLiteral(node)) {
          return;
        }

        if (isAllowedPattern(node)) {
          return;
        }

        if (checker && program) {
          if (assignmentTargetRequiresNull(node, checker, program, parserServices)) {
            return;
          }

          if (argumentRequiresNull(node, checker, program, parserServices)) {
            return;
          }
        }

        if (isLooseEquality(node)) {
          return context.report({
            node,
            messageId: MessageId.noNull,
            fix(fixer) {
              return fixer.replaceText(node, 'undefined');
            },
          });
        }

        if (isStrictEquality(node)) {
          return context.report({
            node,
            messageId: MessageId.noNull,
            suggest: [
              {
                messageId: MessageId.suggestUndefined,
                fix(fixer) {
                  return fixer.replaceText(node, 'undefined');
                },
              },
            ],
          });
        }

        if (canRemoveReturnValue(node)) {
          const parent = node.parent;

          return context.report({
            node,
            messageId: MessageId.noNull,
            fix(fixer) {
              return fixer.removeRange([parent.range[0] + 'return'.length, node.range[1]]);
            },
            suggest: [
              {
                messageId: MessageId.suggestUndefined,
                fix(fixer) {
                  return fixer.replaceText(node, 'undefined');
                },
              },
            ],
          });
        }

        const variableDeclarator = canRemoveInitializer(node);

        if (variableDeclarator) {
          return context.report({
            node,
            messageId: MessageId.noNull,
            fix(fixer) {
              return fixer.removeRange([variableDeclarator.id.range[1], node.range[1]]);
            },
            suggest: [
              {
                messageId: MessageId.suggestUndefined,
                fix(fixer) {
                  return fixer.replaceText(node, 'undefined');
                },
              },
            ],
          });
        }

        return context.report({
          node,
          messageId: 'noNull',
          suggest: [
            {
              messageId: MessageId.suggestUndefined,
              fix(fixer) {
                return fixer.replaceText(node, 'undefined');
              },
            },
          ],
        });
      },
    };
  },
});
