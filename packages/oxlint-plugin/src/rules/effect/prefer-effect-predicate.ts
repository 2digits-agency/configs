import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Str from 'effect/String';

import {
  defineEffectRule,
  findAncestor,
  isEqualityOperator,
  isGlobalIdentifier,
  isStringLiteral,
  ruleMeta,
  unwrapExpression,
} from '../../utils';

type FunctionLike = ESTree.ArrowFunctionExpression | ESTree.Function;

const typeofPredicates: Readonly<Record<string, string>> = {
  bigint: 'P.isBigInt',
  boolean: 'P.isBoolean',
  function: 'P.isFunction',
  number: 'P.isNumber',
  object: 'P.isObjectOrArray',
  string: 'P.isString',
  symbol: 'P.isSymbol',
  undefined: 'P.isUndefined',
};

const nullPredicates: Readonly<Record<string, string>> = {
  '!=': 'P.isNotNullish',
  '!==': 'P.isNotNull',
  '==': 'P.isNullish',
  '===': 'P.isNull',
};

const undefinedPredicates: Readonly<Record<string, string>> = {
  '!=': 'P.isNotNullish',
  '!==': 'P.isNotUndefined',
  '==': 'P.isNullish',
  '===': 'P.isUndefined',
};

const instancePredicates: Readonly<Record<string, string>> = {
  Array: 'Arr.isArray',
  BigInt: 'P.isBigInt',
  Boolean: 'P.isBoolean',
  Date: 'P.isDate',
  Error: 'P.isError',
  Function: 'P.isFunction',
  Map: 'P.isMap',
  Number: 'P.isNumber',
  Promise: 'P.isPromise',
  RegExp: 'P.isRegExp',
  Set: 'P.isSet',
  String: 'P.isString',
  Symbol: 'P.isSymbol',
  Uint8Array: 'P.isUint8Array',
};

// `x instanceof String` only matches `new String(…)`, so P.isString is a different check, not a rewrite.
const boxedConstructors: ReadonlySet<string> = new Set(['BigInt', 'Boolean', 'Number', 'String', 'Symbol']);

function isFunctionLike(node: ESTree.Node): node is FunctionLike {
  return (
    node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
  );
}

// A refinement such as `(u: unknown): u is Foo => typeof u === 'string'` is where a primitive check belongs.
function isInsideTypeGuard(node: ESTree.Node): boolean {
  return findAncestor(node, isFunctionLike)?.returnType?.typeAnnotation.type === 'TSTypePredicate';
}

function isNegated(operator: string): boolean {
  return operator === '!==' || operator === '!=';
}

function nullishPredicate(
  node: ESTree.BinaryExpression,
  value: ESTree.Expression,
  context: Context,
): string | undefined {
  if (value.type === 'Literal' && P.isNull(value.value)) {
    return Opt.getOrUndefined(R.get(nullPredicates, node.operator));
  }

  if (isGlobalIdentifier(value, context, 'undefined')) {
    return Opt.getOrUndefined(R.get(undefinedPredicates, node.operator));
  }

  return undefined;
}

function typeofPredicate(
  node: ESTree.BinaryExpression,
  operand: ESTree.Expression,
  value: ESTree.Expression,
  context: Context,
): string | undefined {
  if (operand.type !== 'UnaryExpression' || operand.operator !== 'typeof' || !isStringLiteral(value)) {
    return undefined;
  }

  const argument = unwrapExpression(operand.argument);

  // `typeof window` guards against a ReferenceError; a predicate call would throw instead.
  if (argument.type === 'Identifier' && isGlobalIdentifier(argument, context, argument.name)) {
    return undefined;
  }

  const predicate = Opt.getOrUndefined(R.get(typeofPredicates, value.value));

  if (P.isUndefined(predicate)) {
    return undefined;
  }

  if (value.value === 'undefined') {
    return isNegated(node.operator) ? 'P.isNotUndefined' : predicate;
  }

  return isNegated(node.operator) ? `P.not(${predicate})` : predicate;
}

function comparisonPredicate(node: ESTree.BinaryExpression, context: Context): string | undefined {
  if (!isEqualityOperator(node.operator)) {
    return undefined;
  }

  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  return (
    typeofPredicate(node, left, right, context) ??
    typeofPredicate(node, right, left, context) ??
    nullishPredicate(node, right, context) ??
    nullishPredicate(node, left, context)
  );
}

function instancePredicate(node: ESTree.BinaryExpression, context: Context): string | undefined {
  const constructor = unwrapExpression(node.right);

  if (constructor.type !== 'Identifier' || !isGlobalIdentifier(constructor, context, constructor.name)) {
    return undefined;
  }

  return Opt.getOrUndefined(R.get(instancePredicates, constructor.name));
}

/**
 * Prefer Effect Predicate guards over hand-written runtime type and nullish checks in Effect files.
 */
export const preferEffectPredicate: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Predicate guards over typeof, instanceof, and nullish comparisons in Effect files.',
    {
      predicate:
        'Use {{predicate}} from Effect instead of this check. Decode unknown input with Schema.is or a Schema decoder instead of narrowing it by hand.',
      objectPredicate:
        "Use {{predicate}} from Effect instead of this check. Unlike typeof x === 'object', it treats null as not an object.",
      boxedInstance:
        '`instanceof {{constructor}}` only matches boxed objects such as `new {{constructor}}(…)`, never primitive values. To check for the primitive, use {{predicate}}.',
    },
    'https://www.effect.website/docs/v4/api/effect/Predicate',
  ),
  (context, getState) => ({
    BinaryExpression(node) {
      if (!getState().hasEffectImport) {
        return;
      }

      const predicate =
        node.operator === 'instanceof' ? instancePredicate(node, context) : comparisonPredicate(node, context);

      if (P.isUndefined(predicate) || isInsideTypeGuard(node)) {
        return;
      }

      const constructor = node.operator === 'instanceof' ? context.sourceCode.getText(node.right) : '';

      if (boxedConstructors.has(constructor)) {
        context.report({ node, messageId: 'boxedInstance', data: { constructor, predicate } });
      } else if (Str.includes('P.isObjectOrArray')(predicate)) {
        context.report({ node, messageId: 'objectPredicate', data: { predicate } });
      } else {
        context.report({ node, messageId: 'predicate', data: { predicate } });
      }
    },
  }),
);
