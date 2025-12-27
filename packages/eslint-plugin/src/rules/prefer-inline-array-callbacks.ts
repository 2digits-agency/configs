import {
  AST_NODE_TYPES,
  ESLintUtils,
  type ParserServicesWithTypeInformation,
  type TSESTree,
} from '@typescript-eslint/utils';
import * as tsutils from 'ts-api-utils';
import type * as ts from 'typescript';

import { createRule } from '../utils';

type MessageId = (typeof MessageId)[keyof typeof MessageId];
const MessageId = {
  noCallbackReference: 'noCallbackReference',
} as const;

export const RULE_NAME = 'prefer-inline-array-callbacks';

const SIMPLE_METHODS = new Map<string, ReadonlySet<string> | undefined>([
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

const REDUCE_METHODS = new Set(['reduce', 'reduceRight']);

const ALL_METHODS = new Set([...SIMPLE_METHODS.keys(), ...REDUCE_METHODS]);

function isGlobalIdentifier(node: TSESTree.Node, name: string): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === name;
}

function isIgnoredCallback(methodName: string, callback: TSESTree.Node): boolean {
  if (callback.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }

  const ignoredCallbacks = SIMPLE_METHODS.get(methodName);

  return ignoredCallbacks?.has(callback.name) ?? false;
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

function needsParentheses(node: TSESTree.Node): boolean {
  return (
    node.type === AST_NODE_TYPES.SequenceExpression
    || node.type === AST_NODE_TYPES.YieldExpression
    || node.type === AST_NODE_TYPES.ArrowFunctionExpression
    || node.type === AST_NODE_TYPES.ConditionalExpression
    || node.type === AST_NODE_TYPES.AssignmentExpression
    || node.type === AST_NODE_TYPES.LogicalExpression
    || node.type === AST_NODE_TYPES.BinaryExpression
    || node.type === AST_NODE_TYPES.UnaryExpression
    || node.type === AST_NODE_TYPES.UpdateExpression
    || node.type === AST_NODE_TYPES.NewExpression
  );
}

function isArrayType(checker: ts.TypeChecker, type: ts.Type): boolean {
  return tsutils
    .unionConstituents(type)
    .flatMap((part: ts.Type) => tsutils.intersectionConstituents(part))
    .every((t: ts.Type) => checker.isArrayType(t) || checker.isTupleType(t));
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

    const services: ParserServicesWithTypeInformation = parserServices;
    const checker = services.program.getTypeChecker();
    const sourceCode = context.sourceCode;

    function checkArrayMethod(node: TSESTree.CallExpression): void {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
        return;
      }

      const { object, property, computed } = node.callee;

      if (computed || property.type !== AST_NODE_TYPES.Identifier) {
        return;
      }

      const methodName = property.name;

      if (!ALL_METHODS.has(methodName)) {
        return;
      }

      if (node.arguments.length === 0 || node.arguments.length > 2) {
        return;
      }

      const callback = node.arguments[0];

      if (!callback || callback.type === AST_NODE_TYPES.SpreadElement) {
        return;
      }

      if (isInlineFunction(callback) || isBindCall(callback)) {
        return;
      }

      if (isIgnoredCallback(methodName, callback)) {
        return;
      }

      const objectType = services.getTypeAtLocation(object);

      if (!isArrayType(checker, objectType)) {
        return;
      }

      const callbackName = getCallbackName(callback);
      const callbackText = sourceCode.getText(callback);
      const wrappedCallback = needsParentheses(callback) ? `(${callbackText})` : callbackText;

      const isReduceMethod = REDUCE_METHODS.has(methodName);
      const params = isReduceMethod ? '(acc, element)' : '(element)';
      const args = isReduceMethod ? 'acc, element' : 'element';

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
      CallExpression: checkArrayMethod,
    };
  },
});
