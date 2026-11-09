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
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import { findAncestor, isEqualityOperator, isStringLiteral, unwrapExpression } from '../../internal/ast';
import { argumentText, replaceWithNamespace } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIn } from '../../internal/scope';

type FunctionLike = ESTree.ArrowFunctionExpression | ESTree.Function;

/**
 * How the Effect guard relates to the check it replaces: `exact` runs the same check and narrows the same way, so it is
 * a fix; `similar` has the same intent but a different result or type, so it is a suggestion; `different` answers
 * another question and is only reported.
 */
type Equivalence = 'exact' | 'similar' | 'different';

const namespaceSources = { Arr: 'effect/Array', P: 'effect/Predicate' } as const;

interface PredicateCheck {
  readonly namespace: keyof typeof namespaceSources;
  readonly member: string;
  /**
   * The value the check tests.
   */
  readonly subject: ESTree.Node;
  readonly negated: boolean;
  readonly equivalence: Equivalence;
}

const typeofMembers: Readonly<Record<string, string>> = {
  bigint: 'isBigInt',
  boolean: 'isBoolean',
  function: 'isFunction',
  number: 'isNumber',
  object: 'isObjectOrArray',
  string: 'isString',
  symbol: 'isSymbol',
  undefined: 'isUndefined',
};

const nullMembers: Readonly<Record<string, string>> = {
  '!=': 'isNotNullish',
  '!==': 'isNotNull',
  '==': 'isNullish',
  '===': 'isNull',
};

const undefinedMembers: Readonly<Record<string, string>> = {
  '!=': 'isNotNullish',
  '!==': 'isNotUndefined',
  '==': 'isNullish',
  '===': 'isUndefined',
};

/*
 * Effect implements the `exact` guards with the same `instanceof`. `Arr.isArray` also accepts arrays from other realms
 * and narrows to `unknown[]` instead of `any[]`, `P.isFunction` checks `typeof` and `P.isPromise` checks the shape.
 * `x instanceof String` only matches `new String(…)`, so P.isString is a different check, not a rewrite.
 */
const instanceChecks: Readonly<Record<string, readonly [PredicateCheck['namespace'], string, Equivalence]>> = {
  Array: ['Arr', 'isArray', 'similar'],
  BigInt: ['P', 'isBigInt', 'different'],
  Boolean: ['P', 'isBoolean', 'different'],
  Date: ['P', 'isDate', 'exact'],
  Error: ['P', 'isError', 'exact'],
  Function: ['P', 'isFunction', 'similar'],
  Map: ['P', 'isMap', 'exact'],
  Number: ['P', 'isNumber', 'different'],
  Promise: ['P', 'isPromise', 'similar'],
  RegExp: ['P', 'isRegExp', 'exact'],
  Set: ['P', 'isSet', 'exact'],
  String: ['P', 'isString', 'different'],
  Symbol: ['P', 'isSymbol', 'different'],
  Uint8Array: ['P', 'isUint8Array', 'exact'],
};

const NegatedOperator = Schema.Literals(['!==', '!=']);

const isNegated = Schema.is(NegatedOperator);

function isFunctionLike(node: ESTree.Node): node is FunctionLike {
  return (
    node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
  );
}

function nullishCheck(
  node: ESTree.BinaryExpression,
  subject: ESTree.Node,
  value: ESTree.Expression,
  scope: OxlintScope,
): Opt.Option<PredicateCheck> {
  const members =
    value.type === 'Literal' && P.isNull(value.value)
      ? Opt.some(nullMembers)
      : Opt.liftPredicate(undefinedMembers, () => isGlobalIn(scope, value, 'undefined'));

  return Opt.map(Opt.flatMap(members, R.get(node.operator)), (member) => ({
    namespace: 'P',
    member,
    subject,
    negated: false,
    equivalence: 'exact',
  }));
}

function typeofCheck(
  node: ESTree.BinaryExpression,
  operand: ESTree.Expression,
  value: ESTree.Expression,
  scope: OxlintScope,
): Opt.Option<PredicateCheck> {
  if (operand.type !== 'UnaryExpression' || operand.operator !== 'typeof' || !isStringLiteral(value)) {
    return Opt.none();
  }

  const argument = unwrapExpression(operand.argument);

  // `typeof window` guards against a ReferenceError; a predicate call would throw instead.
  if (argument.type === 'Identifier' && isGlobalIn(scope, argument, argument.name)) {
    return Opt.none();
  }

  return Opt.map(R.get(typeofMembers, value.value), (member) => {
    const notUndefined = value.value === 'undefined' && isNegated(node.operator);

    return {
      namespace: 'P',
      member: notUndefined ? 'isNotUndefined' : member,
      subject: operand.argument,
      // `!P.isString(x)` narrows like `typeof x !== 'string'`; `P.not(P.isString)` returns a plain Predicate.
      negated: isNegated(node.operator) && !notUndefined,
      // Unlike `typeof x === 'object'`, P.isObjectOrArray is false for null.
      equivalence: value.value === 'object' ? 'similar' : 'exact',
    };
  });
}

function comparisonCheck(node: ESTree.BinaryExpression, scope: OxlintScope): Opt.Option<PredicateCheck> {
  if (!isEqualityOperator(node.operator)) {
    return Opt.none();
  }

  const left = unwrapExpression(node.left);

  const right = unwrapExpression(node.right);

  return typeofCheck(node, left, right, scope).pipe(
    Opt.orElse(() => typeofCheck(node, right, left, scope)),
    Opt.orElse(() => nullishCheck(node, node.left, right, scope)),
    Opt.orElse(() => nullishCheck(node, node.right, left, scope)),
  );
}

function instanceCheck(node: ESTree.BinaryExpression, scope: OxlintScope): Opt.Option<PredicateCheck> {
  const constructor = unwrapExpression(node.right);

  return constructor.type === 'Identifier' && isGlobalIn(scope, constructor, constructor.name)
    ? Opt.map(R.get(instanceChecks, constructor.name), ([namespace, member, equivalence]) => ({
        namespace,
        member,
        subject: node.left,
        negated: false,
        equivalence,
      }))
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
      replace: 'Replace with {{predicate}}.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Predicate',
    fixable: 'code',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const report = Effect.fnUntraced(function* (node: ESTree.BinaryExpression, check: PredicateCheck) {
      const { namespace, member, negated, equivalence } = check;

      const prefix = negated ? '!' : '';

      const predicate = `${prefix}${namespace}.${member}`;

      const diagnostic = Diagnostic.fromId(
        equivalence === 'different'
          ? { node, messageId: 'boxedInstance', data: { constructor: ctx.sourceCode.getText(node.right), predicate } }
          : { node, messageId: member === 'isObjectOrArray' ? 'objectPredicate' : 'predicate', data: { predicate } },
      );

      // A rewrite would drop the comments inside the check.
      if (equivalence === 'different' || Arr.isReadonlyArrayNonEmpty(ctx.sourceCode.getCommentsInside(node))) {
        return yield* ctx.report(diagnostic);
      }

      const fix = yield* replaceWithNamespace(
        node,
        namespaceSources[namespace],
        namespace,
        (alias) => `${prefix}${alias}.${member}(${argumentText(ctx.sourceCode, check.subject)})`,
      );

      return yield* ctx.report(
        equivalence === 'exact'
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'replace', data: { predicate }, fix }]),
      );
    });

    return Visitor.on('BinaryExpression', (node) =>
      Effect.flatMap(SourceCode.getScope(node), (scope) =>
        Opt.match(
          Opt.filter(
            node.operator === 'instanceof' ? instanceCheck(node, scope) : comparisonCheck(node, scope),
            () => !isInsideRefinement(node),
          ),
          { onNone: () => Effect.void, onSome: (check) => report(node, check) },
        ),
      ),
    );
  },
});
