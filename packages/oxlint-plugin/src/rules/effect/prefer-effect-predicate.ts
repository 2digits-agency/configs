import {
  Diagnostic,
  Rule,
  RuleContext,
  SourceCode,
  Visitor,
  type CreateRule,
  type ESTree,
  type OxlintScope,
} from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { findAncestor, isEqualityOperator, isStringLiteral, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIn } from '../../internal/scope';

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
const BoxedConstructor = Schema.Literals(['BigInt', 'Boolean', 'Number', 'String', 'Symbol']);

const isBoxedConstructor = Schema.is(BoxedConstructor);

const NegatedOperator = Schema.Literals(['!==', '!=']);

const isNegated = Schema.is(NegatedOperator);

function isFunctionLike(node: ESTree.Node): node is FunctionLike {
  return (
    node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
  );
}

function nullishPredicate(
  node: ESTree.BinaryExpression,
  value: ESTree.Expression,
  scope: OxlintScope,
): Opt.Option<string> {
  if (value.type === 'Literal' && P.isNull(value.value)) {
    return R.get(nullPredicates, node.operator);
  }

  return isGlobalIn(scope, value, 'undefined') ? R.get(undefinedPredicates, node.operator) : Opt.none();
}

function typeofPredicate(
  node: ESTree.BinaryExpression,
  operand: ESTree.Expression,
  value: ESTree.Expression,
  scope: OxlintScope,
): Opt.Option<string> {
  if (operand.type !== 'UnaryExpression' || operand.operator !== 'typeof' || !isStringLiteral(value)) {
    return Opt.none();
  }

  const argument = unwrapExpression(operand.argument);

  // `typeof window` guards against a ReferenceError; a predicate call would throw instead.
  if (argument.type === 'Identifier' && isGlobalIn(scope, argument, argument.name)) {
    return Opt.none();
  }

  return Opt.map(R.get(typeofPredicates, value.value), (predicate) => {
    if (!isNegated(node.operator)) {
      return predicate;
    }

    return value.value === 'undefined' ? 'P.isNotUndefined' : `P.not(${predicate})`;
  });
}

function comparisonPredicate(node: ESTree.BinaryExpression, scope: OxlintScope): Opt.Option<string> {
  if (!isEqualityOperator(node.operator)) {
    return Opt.none();
  }

  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  return typeofPredicate(node, left, right, scope).pipe(
    Opt.orElse(() => typeofPredicate(node, right, left, scope)),
    Opt.orElse(() => nullishPredicate(node, right, scope)),
    Opt.orElse(() => nullishPredicate(node, left, scope)),
  );
}

function instancePredicate(node: ESTree.BinaryExpression, scope: OxlintScope): Opt.Option<string> {
  const constructor = unwrapExpression(node.right);

  return constructor.type === 'Identifier' && isGlobalIn(scope, constructor, constructor.name)
    ? R.get(instancePredicates, constructor.name)
    : Opt.none();
}

// A refinement such as `(u: unknown): u is Foo => typeof u === 'string'` is where a primitive check belongs.
function isInsideRefinement(node: ESTree.Node): boolean {
  return Opt.exists(
    findAncestor(node, isFunctionLike),
    (callback) => callback.returnType?.typeAnnotation.type === 'TSTypePredicate',
  );
}

/**
 * Prefer Effect Predicate guards over hand-written runtime type and nullish checks in Effect files.
 */
export const preferEffectPredicate: CreateRule = Rule.define({
  name: 'prefer-effect-predicate',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Predicate guards over typeof, instanceof, and nullish comparisons in Effect files.',
    messages: {
      predicate:
        'Use {{predicate}} from Effect instead of this check. Decode unknown input with Schema.is or a Schema decoder instead of narrowing it by hand.',
      objectPredicate:
        "Use {{predicate}} from Effect instead of this check. Unlike typeof x === 'object', it treats null as not an object.",
      boxedInstance:
        '`instanceof {{constructor}}` only matches boxed objects such as `new {{constructor}}(…)`, never primitive values. To check for the primitive, use {{predicate}}.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Predicate',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.BinaryExpression, predicate: string) {
      const constructor = node.operator === 'instanceof' ? ctx.sourceCode.getText(node.right) : '';

      if (isBoxedConstructor(constructor)) {
        return ctx.report(Diagnostic.fromId({ node, messageId: 'boxedInstance', data: { constructor, predicate } }));
      }

      const messageId = Str.includes('P.isObjectOrArray')(predicate) ? 'objectPredicate' : 'predicate';

      return ctx.report(Diagnostic.fromId({ node, messageId, data: { predicate } }));
    }

    return Visitor.on('BinaryExpression', (node) =>
      Effect.flatMap(SourceCode.getScope(node), (scope) =>
        Opt.match(
          Opt.filter(
            node.operator === 'instanceof' ? instancePredicate(node, scope) : comparisonPredicate(node, scope),
            () => !isInsideRefinement(node),
          ),
          { onNone: () => Effect.void, onSome: (predicate) => report(node, predicate) },
        ),
      ),
    );
  },
});
