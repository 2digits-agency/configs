import { ScopeType } from '@typescript-eslint/scope-manager';
import { AST_NODE_TYPES, ASTUtils, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import * as tsutils from 'ts-api-utils';
import type ts from 'typescript';

import { createRule } from '../utils';

type MessageId = 'noCallbackReference';

export const RULE_NAME = 'prefer-inline-array-callbacks';

const SIMPLE_METHODS = new Map([
  ['every', new Set(['Boolean'])],
  ['filter', new Set(['Boolean'])],
  ['find', new Set(['Boolean'])],
  ['findLast', new Set(['Boolean'])],
  ['findIndex', new Set(['Boolean'])],
  ['findLastIndex', new Set(['Boolean'])],
  ['flatMap', undefined],
  ['forEach', undefined],
  ['map', new Set(['String', 'Number', 'BigInt', 'Boolean', 'Symbol'])],
  ['some', new Set(['Boolean'])],
]);

// Methods whose callback receives more than the element, mapped to the arguments the fix forwards.
const MULTI_ARGUMENT_METHODS = new Map([
  ['reduce', 'acc, element'],
  ['reduceRight', 'acc, element'],
  ['sort', 'a, b'],
  ['toSorted', 'a, b'],
]);

const ALL_METHODS = new Set([...SIMPLE_METHODS.keys(), ...MULTI_ARGUMENT_METHODS.keys()]);

function isIgnoredCallback(
  methodName: string,
  callback: TSESTree.Node,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean {
  if (callback.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  const ignoredCallbacks = SIMPLE_METHODS.get(methodName);

  if (!ignoredCallbacks?.has(callback.name)) {
    return false;
  }

  const scope = sourceCode.getScope(callback);

  const reference = scope.references.find((ref) => ref.identifier === callback);

  if (!reference?.resolved) {
    return true;
  }

  return reference.resolved.scope.type === ScopeType.global;
}

function isBindCall(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'bind'
  );
}

function getCallbackName(node: TSESTree.Node): string {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }

  if (node.type === AST_NODE_TYPES.MemberExpression) {
    if (node.property.type === AST_NODE_TYPES.Identifier) {
      return node.property.name;
    }

    if (node.property.type === AST_NODE_TYPES.Literal) {
      return String(node.property.value);
    }
  }

  return 'callback';
}

const NEEDS_PARENTHESES = new Set<TSESTree.Node['type']>([
  AST_NODE_TYPES.SequenceExpression,
  AST_NODE_TYPES.YieldExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.ConditionalExpression,
  AST_NODE_TYPES.AssignmentExpression,
  AST_NODE_TYPES.LogicalExpression,
  AST_NODE_TYPES.BinaryExpression,
  AST_NODE_TYPES.UnaryExpression,
  AST_NODE_TYPES.UpdateExpression,
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSTypeAssertion,
]);

function isArrayType(checker: ts.TypeChecker, type: ts.Type) {
  return tsutils
    .unionConstituents(type)
    .some((unionPart) =>
      tsutils.intersectionConstituents(unionPart).every((t) => checker.isArrayType(t) || checker.isTupleType(t)),
    );
}

export const preferInlineArrayCallbacks = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow passing function references to array methods',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noCallbackReference:
        'Do not pass `{{name}}` by reference to `Array#{{method}}`. Array methods pass extra arguments (index, array) which may cause unexpected behavior.',
    },
    defaultOptions: [],
  },
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context, true);

    if (!parserServices.program) {
      return {};
    }

    const checker = parserServices.program.getTypeChecker();

    function checkArrayMethod(node: TSESTree.CallExpression): void {
      const { object, property } = node.callee as TSESTree.MemberExpression;

      const { name: methodName } = property as TSESTree.Identifier;

      if (!ALL_METHODS.has(methodName) || node.arguments.length > 2) {
        return;
      }

      const [callback] = node.arguments;

      if (
        !callback ||
        callback.type === AST_NODE_TYPES.SpreadElement ||
        ASTUtils.isFunction(callback) ||
        isBindCall(callback) ||
        isIgnoredCallback(methodName, callback, context.sourceCode)
      ) {
        return;
      }

      const objectType = checker.getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(object));

      if (!isArrayType(checker, objectType)) {
        return;
      }

      const callbackName = getCallbackName(callback);

      const callbackText = context.sourceCode.getText(callback);

      const wrappedCallback = NEEDS_PARENTHESES.has(callback.type) ? `(${callbackText})` : callbackText;

      const args = MULTI_ARGUMENT_METHODS.get(methodName) ?? 'element';

      const call = `${wrappedCallback}(${args})`;

      const body = methodName === 'forEach' ? `{ ${call}; }` : call;

      const fixedCallback = `(${args}) => ${body}`;

      context.report({
        node: callback,
        messageId: 'noCallbackReference',
        data: { name: callbackName, method: methodName },
        fix(fixer) {
          return fixer.replaceText(callback, fixedCallback);
        },
      });
    }

    return {
      'CallExpression[callee.type="MemberExpression"][callee.computed=false][callee.property.type="Identifier"]':
        checkArrayMethod,
    };
  },
});
