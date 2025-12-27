import { ScopeType } from '@typescript-eslint/scope-manager';
import { AST_NODE_TYPES, ESLintUtils, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import * as tsutils from 'ts-api-utils';
import type ts from 'typescript';

import { createRule } from '../utils';

type MessageId = (typeof MessageId)[keyof typeof MessageId];
const MessageId = {
  noCallbackReference: 'noCallbackReference',
} as const;

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

const COMPARE_METHODS = new Set(['sort', 'toSorted']);

const REDUCE_METHODS = new Set(['reduce', 'reduceRight']);

const ALL_METHODS = new Set([...SIMPLE_METHODS.keys(), ...REDUCE_METHODS, ...COMPARE_METHODS]);

const arrayTypeCache = new WeakMap<TSESTree.Node, boolean>();

function isGlobalIdentifier(node: TSESTree.Node, name: string): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

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

function isInlineFunction(node: TSESTree.Node): boolean {
  return node.type === AST_NODE_TYPES.ArrowFunctionExpression || node.type === AST_NODE_TYPES.FunctionExpression;
}

function isBindCall(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.CallExpression
    && node.callee.type === AST_NODE_TYPES.MemberExpression
    && isGlobalIdentifier(node.callee.property, 'bind')
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

const needsParenthesesItems = [
  AST_NODE_TYPES.SequenceExpression,
  AST_NODE_TYPES.YieldExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.ConditionalExpression,
  AST_NODE_TYPES.AssignmentExpression,
  AST_NODE_TYPES.LogicalExpression,
  AST_NODE_TYPES.BinaryExpression,
  AST_NODE_TYPES.UnaryExpression,
  AST_NODE_TYPES.UpdateExpression,
] as const;

type NeedsParenthesesNode = Extract<TSESTree.Node, { type: (typeof needsParenthesesItems)[number] }>;

function needsParentheses(node: TSESTree.Node): node is NeedsParenthesesNode {
  return needsParenthesesItems.includes(node.type as never);
}

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
  },
  defaultOptions: [],
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context, true);

    if (!parserServices.program || !('getTypeAtLocation' in parserServices)) {
      return {};
    }

    const checker = parserServices.program.getTypeChecker();

    function checkArrayMethod(node: TSESTree.CallExpression): void {
      const { object, property } = node.callee as TSESTree.MemberExpression;

      const methodName = (property as TSESTree.Identifier).name;

      if (!ALL_METHODS.has(methodName)) {
        return;
      }

      if (node.arguments.length === 0 || node.arguments.length > 2) {
        return;
      }

      const [callback] = node.arguments;

      if (!callback || callback.type === AST_NODE_TYPES.SpreadElement) {
        return;
      }

      if (isInlineFunction(callback) || isBindCall(callback)) {
        return;
      }

      if (isIgnoredCallback(methodName, callback, context.sourceCode)) {
        return;
      }

      let isArray = arrayTypeCache.get(object);

      if (isArray === undefined) {
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(object);
        const objectType = checker.getTypeAtLocation(tsNode);

        isArray = isArrayType(checker, objectType);
        arrayTypeCache.set(object, isArray);
      }

      if (!isArray) {
        return;
      }

      const callbackName = getCallbackName(callback);
      const callbackText = context.sourceCode.getText(callback);
      const wrappedCallback = needsParentheses(callback) ? `(${callbackText})` : callbackText;

      const isReduceMethod = REDUCE_METHODS.has(methodName);
      const isCompareMethod = COMPARE_METHODS.has(methodName);
      const params = isReduceMethod ? '(acc, element)' : isCompareMethod ? '(a, b)' : '(element)';
      const args = isReduceMethod ? 'acc, element' : isCompareMethod ? 'a, b' : 'element';

      const body = methodName === 'forEach' ? `{ ${wrappedCallback}(${args}); }` : `${wrappedCallback}(${args})`;

      const fixedCallback = `${params} => ${body}`;

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
