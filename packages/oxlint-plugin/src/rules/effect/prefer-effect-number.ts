import {
  Diagnostic,
  Rule,
  RuleContext,
  SourceCode,
  Visitor,
  type ESTree,
  type OxlintScope,
  type OxlintSourceCode,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { argumentAt, staticPath, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { argumentText, replaceWithNamespace } from '../../internal/fixes';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIn, isImportedApiIn } from '../../internal/scope';

type Kind = 'clamp' | 'round' | 'sumAll' | 'multiplyAll';

/**
 * `fix` keeps the behavior, `suggest` changes it in edge cases, `report` has no safe rewrite.
 */
type Mode = 'fix' | 'suggest' | 'report';

interface Finding {
  readonly kind: Kind;
  readonly mode: Mode;
  /**
   * Replacement text for the `effect/Number` alias the file ends up with.
   */
  readonly replacement: (alias: string) => string;
}

type Pair = readonly [ESTree.Expression, ESTree.Expression];

const isMinMax = Schema.is(Schema.Literals(['min', 'max']));

// Names that read as a bound rather than the clamped value, such as `min`, `maxWidth` or `upperBound`.
const isBoundName = Schema.is(Schema.String.check(Schema.isPattern(/min|max|lower|upper|bound|limit/iu)));

// Every power of ten up to 1e22 is an exact double, so `Math.pow(10, k)` equals the literal.
const maxExactPowerOfTen = 22;

/**
 * The value of a numeric literal, also with a sign: `2`, `-1` or `+0.5`.
 *
 * @param node Expression.
 */
function numericValue(node: ESTree.Expression): Opt.Option<number> {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return Opt.liftPredicate(expression.value, P.isNumber);
  }

  return expression.type === 'UnaryExpression' && (expression.operator === '-' || expression.operator === '+')
    ? Opt.map(numericValue(expression.argument), (value) => (expression.operator === '-' ? -value : value))
    : Opt.none();
}

/**
 * Whether evaluating an expression has no observable effect, so a fix may evaluate it at another time or once instead
 * of twice. Property reads count as free of effects.
 *
 * @param node Expression.
 */
function isSideEffectFree(node: ESTree.Expression): boolean {
  return Match.value(unwrapExpression(node)).pipe(
    Match.discriminators('type')({
      Identifier: Fn.constTrue,
      Literal: Fn.constTrue,
      ThisExpression: Fn.constTrue,
      UnaryExpression: ({ operator, argument }) => operator !== 'delete' && isSideEffectFree(argument),
      // `#field in object` has a private name on the left.
      BinaryExpression: ({ left, right }) =>
        left.type !== 'PrivateIdentifier' && isSideEffectFree(left) && isSideEffectFree(right),
      MemberExpression: ({ object, computed, property }) =>
        isSideEffectFree(object) && (!computed || isSideEffectFree(property)),
    }),
    Match.orElse(Fn.constFalse),
  );
}

/**
 * The arguments of a `Math.<member>(…)` call on the global `Math`.
 *
 * @param node Expression.
 * @param scope Scope of the expression.
 * @param member `Math` member, such as `min`.
 * @param arity Number of arguments.
 */
function mathArguments(
  node: ESTree.Expression,
  scope: OxlintScope,
  member: string,
  arity: number,
): Opt.Option<ReadonlyArray<ESTree.Expression>> {
  const call = unwrapExpression(node);

  if (
    call.type !== 'CallExpression' ||
    call.optional ||
    call.arguments.length !== arity ||
    call.callee.type !== 'MemberExpression' ||
    call.callee.optional ||
    !isGlobalIn(scope, call.callee.object, 'Math') ||
    !Opt.contains(staticPropertyName(call.callee), member)
  ) {
    return Opt.none();
  }

  return Opt.all(Arr.map(call.arguments, (_, index) => argumentAt(call, index)));
}

function mathPair(node: ESTree.Expression, scope: OxlintScope, member: string): Opt.Option<Pair> {
  return Opt.flatMap(mathArguments(node, scope, member, 2), ([first, second]) =>
    P.isNotUndefined(first) && P.isNotUndefined(second) ? Opt.some([first, second] as const) : Opt.none(),
  );
}

function isBoundLike(node: ESTree.Expression): boolean {
  return (
    Opt.isSome(numericValue(node)) ||
    staticPath(unwrapExpression(node)).pipe(Opt.map(Arr.lastNonEmpty), Opt.exists(isBoundName))
  );
}

/**
 * Whether a fix may evaluate `operands` in another order: none has effects, or all but one are number literals.
 *
 * @param operands Operands.
 */
function reordersSafely(operands: ReadonlyArray<ESTree.Expression>): boolean {
  return (
    Arr.every(operands, isSideEffectFree) || Arr.countBy(operands, (operand) => Opt.isNone(numericValue(operand))) <= 1
  );
}

/**
 * Whether two scale factors are the same: `1e3` and `1000` compare by value, other factors by their text.
 *
 * @param factor Factor inside `Math.round`.
 * @param divisor Divisor after it.
 * @param sourceCode Source of the file.
 */
function isSameFactor(factor: ESTree.Expression, divisor: ESTree.Expression, sourceCode: OxlintSourceCode): boolean {
  return Opt.match(numericValue(factor), {
    onSome: (value) => Opt.contains(numericValue(divisor), value),
    onNone: () => sourceCode.getText(unwrapExpression(factor)) === sourceCode.getText(unwrapExpression(divisor)),
  });
}

/**
 * Whether `left` and `right` are the two parameters of a reducer, in either order, as in `(a, b) => b + a`.
 *
 * @param params Reducer parameters.
 * @param left Left operand.
 * @param right Right operand.
 */
function isParameterPair(
  params: ReadonlyArray<ESTree.Node>,
  left: ESTree.Expression,
  right: ESTree.Expression,
): boolean {
  const [first, second] = params;

  return (
    first?.type === 'Identifier' &&
    second?.type === 'Identifier' &&
    first.name !== second.name &&
    left.type === 'Identifier' &&
    right.type === 'Identifier' &&
    ((left.name === first.name && right.name === second.name) ||
      (left.name === second.name && right.name === first.name))
  );
}

/**
 * `Math.min(hi, Math.max(lo, x))` or `Math.max(lo, Math.min(hi, x))`, with the arguments of each call in either order.
 *
 * @param node Outer call.
 * @param scope Scope of the call.
 * @param sourceCode Source of the file.
 */
function clampFinding(
  node: ESTree.CallExpression,
  scope: OxlintScope,
  sourceCode: OxlintSourceCode,
): Opt.Option<Finding> {
  const outerMember = node.callee.type === 'MemberExpression' ? staticPropertyName(node.callee) : Opt.none();

  return outerMember.pipe(
    Opt.filter(isMinMax),
    Opt.flatMap((outer) => {
      const inner = outer === 'min' ? 'max' : 'min';

      return mathPair(node, scope, outer).pipe(
        Opt.flatMap(([first, second]) =>
          mathPair(second, scope, inner).pipe(
            Opt.map((pair) => [first, pair] as const),
            Opt.orElse(() => Opt.map(mathPair(first, scope, inner), (pair) => [second, pair] as const)),
          ),
        ),
        Opt.flatMap(([outerBound, [innerFirst, innerSecond]]) => {
          // `Math.max` and `Math.min` are symmetric, so which inner argument is the value only changes the fix's text.
          const [innerBound, value] =
            isBoundLike(innerSecond) && !isBoundLike(innerFirst)
              ? [innerSecond, innerFirst]
              : [innerFirst, innerSecond];

          const [minimum, maximum] = outer === 'min' ? [innerBound, outerBound] : [outerBound, innerBound];

          // With `minimum > maximum`, `Math.max(lo, Math.min(hi, x))` returns `lo` where Number.clamp returns `hi`.
          if (Opt.exists(Opt.all([numericValue(minimum), numericValue(maximum)]), ([lo, hi]) => lo > hi)) {
            return Opt.none();
          }

          return Opt.some({
            kind: 'clamp',
            // The fix evaluates the value first and the bounds after it.
            mode: reordersSafely([outerBound, innerFirst, innerSecond]) ? 'fix' : 'suggest',
            replacement: (alias) =>
              `${alias}.clamp(${argumentText(sourceCode, value)}, { minimum: ${argumentText(sourceCode, minimum)}, maximum: ${argumentText(sourceCode, maximum)} })`,
          } satisfies Finding);
        }),
      );
    }),
  );
}

/**
 * The decimal precision a scale factor stands for: `2` for `100`, `n` for `10 ** n` or `Math.pow(10, n)`.
 *
 * @param node Scale factor.
 * @param scope Scope of the factor.
 */
function precisionOf(node: ESTree.Expression, scope: OxlintScope): Opt.Option<ESTree.Expression | number> {
  const factor = unwrapExpression(node);

  if (factor.type === 'BinaryExpression' && factor.operator === '**') {
    return Opt.contains(numericValue(factor.left), 10) ? Opt.some(factor.right) : Opt.none();
  }

  const pow = Opt.flatMap(mathPair(factor, scope, 'pow'), ([base, exponent]) =>
    Opt.contains(numericValue(base), 10) ? Opt.some<ESTree.Expression | number>(exponent) : Opt.none(),
  );

  return Opt.orElse(pow, () =>
    numericValue(factor).pipe(
      Opt.map(Math.log10),
      Opt.map(Math.round),
      Opt.filter(
        (power) => power >= 1 && power <= maxExactPowerOfTen && Opt.contains(numericValue(factor), 10 ** power),
      ),
    ),
  );
}

/**
 * `Math.round(x * f) / f` with `f` a power of ten.
 *
 * @param node Division.
 * @param scope Scope of the division.
 * @param sourceCode Source of the file.
 */
function roundFinding(
  node: ESTree.BinaryExpression,
  scope: OxlintScope,
  sourceCode: OxlintSourceCode,
): Opt.Option<Finding> {
  if (node.operator !== '/') {
    return Opt.none();
  }

  const divisor = node.right;

  return mathArguments(node.left, scope, 'round', 1).pipe(
    Opt.flatMap(Arr.head),
    Opt.map(unwrapExpression),
    Opt.filter(
      (product): product is ESTree.BinaryExpression => product.type === 'BinaryExpression' && product.operator === '*',
    ),
    Opt.flatMap(({ left, right }) =>
      isSameFactor(right, divisor, sourceCode)
        ? Opt.some([left, right] as const)
        : isSameFactor(left, divisor, sourceCode)
          ? Opt.some([right, left] as const)
          : Opt.none(),
    ),
    Opt.flatMap(([value, factor]) =>
      Opt.map(precisionOf(factor, scope), (precision) => {
        const precisionText = P.isNumber(precision) ? String(precision) : argumentText(sourceCode, precision);

        // The original evaluates the precision twice; the fix evaluates it once.
        const mode: Mode = P.isNumber(precision) || isSideEffectFree(precision) ? 'fix' : 'report';

        return {
          kind: 'round',
          mode,
          replacement: (alias) => `${alias}.round(${argumentText(sourceCode, value)}, ${precisionText})`,
        } satisfies Finding;
      }),
    ),
  );
}

/**
 * The operator a reducer applies: `+` for `(a, b) => a + b` or `Number.sum`, `*` for `(a, b) => a * b` or
 * `Number.multiply`.
 *
 * @param node Reducer.
 * @param imports Effect imports of the file.
 * @param sourceCode Source of the file.
 */
function reducerOperator(
  node: ESTree.Expression,
  imports: ImportBindings,
  sourceCode: OxlintSourceCode,
): Opt.Option<'+' | '*'> {
  const reducer = unwrapExpression(node);

  // A local binding that shadows the import is not Effect's reducer.
  if (imports.isApi(reducer, 'Number', 'sum') && isImportedApiIn(sourceCode, reducer)) {
    return Opt.some('+');
  }

  if (imports.isApi(reducer, 'Number', 'multiply') && isImportedApiIn(sourceCode, reducer)) {
    return Opt.some('*');
  }

  if (
    (reducer.type !== 'ArrowFunctionExpression' && reducer.type !== 'FunctionExpression') ||
    reducer.async ||
    reducer.generator ||
    reducer.params.length !== 2 ||
    P.isNull(reducer.body)
  ) {
    return Opt.none();
  }

  const body = reducer.body;

  const returned =
    body.type === 'BlockStatement'
      ? Opt.flatMap(
          Opt.liftPredicate(body.body, (statements) => statements.length === 1),
          (statements) =>
            Opt.flatMap(Arr.head(statements), (statement) =>
              statement.type === 'ReturnStatement' && P.isNotNullish(statement.argument)
                ? Opt.some(statement.argument)
                : Opt.none(),
            ),
        )
      : Opt.some(body);

  return returned.pipe(
    Opt.map(unwrapExpression),
    Opt.filter(
      (expression): expression is ESTree.BinaryExpression =>
        expression.type === 'BinaryExpression' && (expression.operator === '+' || expression.operator === '*'),
    ),
    // The order of the operands does not matter for numbers.
    Opt.filter(({ left, right }) => isParameterPair(reducer.params, unwrapExpression(left), unwrapExpression(right))),
    Opt.map(({ operator }) => (operator === '+' ? '+' : '*')),
  );
}

function aggregateFinding(
  kind: Kind,
  collection: Opt.Option<ESTree.Expression>,
  sourceCode: OxlintSourceCode,
): Finding {
  return {
    kind,
    // Number.multiplyAll returns 0 at the first 0, so `[0, NaN]` gives 0 where the reduce gives NaN.
    mode: kind === 'sumAll' ? 'fix' : 'suggest',
    replacement: (alias) =>
      Opt.match(collection, {
        onNone: () => `${alias}.${kind}`,
        onSome: (items) => `${alias}.${kind}(${argumentText(sourceCode, items)})`,
      }),
  };
}

function reduceKind(operator: '+' | '*', initial: ESTree.Expression): Opt.Option<Kind> {
  const identity = operator === '+' ? 0 : 1;

  // A `-0` start keeps `[].reduce(add, -0)` at -0, where Number.sumAll returns 0.
  return Opt.exists(numericValue(initial), (value) => Object.is(value, identity))
    ? Opt.some(operator === '+' ? 'sumAll' : 'multiplyAll')
    : Opt.none();
}

/**
 * `xs.reduce((a, b) => a + b, 0)`, `Arr.reduce(xs, 0, (a, b) => a + b)` or `Arr.reduce(0, (a, b) => a + b)`, and the
 * product with `1`.
 *
 * @param node Call.
 * @param imports Effect imports of the file.
 * @param sourceCode Source of the file.
 */
function reduceFinding(
  node: ESTree.CallExpression,
  imports: ImportBindings,
  sourceCode: OxlintSourceCode,
): Opt.Option<Finding> {
  if (imports.isApi(node.callee, 'Array', 'reduce') && isImportedApiIn(sourceCode, node.callee)) {
    if (node.arguments.length !== 2 && node.arguments.length !== 3) {
      return Opt.none();
    }

    const [collection, initial, reducer] =
      node.arguments.length === 3
        ? [argumentAt(node, 0), argumentAt(node, 1), argumentAt(node, 2)]
        : [Opt.none(), argumentAt(node, 0), argumentAt(node, 1)];

    return Opt.all([initial, reducer]).pipe(
      Opt.flatMap(([init, fn]) =>
        Opt.flatMap(reducerOperator(fn, imports, sourceCode), (operator) => reduceKind(operator, init)),
      ),
      Opt.filter(() => node.arguments.length === 2 || Opt.isSome(collection)),
      Opt.map((kind) => aggregateFinding(kind, collection, sourceCode)),
    );
  }

  const callee = node.callee;

  if (
    node.optional ||
    node.arguments.length !== 2 ||
    callee.type !== 'MemberExpression' ||
    callee.optional ||
    callee.object.type === 'Super' ||
    !Opt.contains(staticPropertyName(callee), 'reduce') ||
    Opt.isSome(imports.path(callee))
  ) {
    return Opt.none();
  }

  return Opt.all([argumentAt(node, 0), argumentAt(node, 1)]).pipe(
    Opt.flatMap(([fn, init]) =>
      Opt.flatMap(reducerOperator(fn, imports, sourceCode), (operator) => reduceKind(operator, init)),
    ),
    Opt.map((kind) => aggregateFinding(kind, Opt.some(callee.object), sourceCode)),
  );
}

/**
 * Prefer Effect Number helpers over hand-written clamping, rounding, sums and products in Effect files.
 */
export const preferEffectNumber = Rule.define({
  name: 'prefer-effect-number',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Prefer Effect Number helpers over nested Math.min and Math.max, scaled Math.round, and sum or product reduces in Effect files.',
    messages: {
      clamp: 'Use Number.clamp from Effect instead of nesting Math.min and Math.max.',
      round: 'Use Number.round from Effect instead of scaling Math.round by a power of ten.',
      sumAll: 'Use Number.sumAll from Effect instead of summing with reduce.',
      multiplyAll:
        'Use Number.multiplyAll from Effect instead of multiplying with reduce. It returns 0 at the first 0, even when NaN or Infinity follows.',
      replace: 'Replace with Number.{{api}}.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Number',
    fixable: 'code',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    const report = Effect.fnUntraced(function* (node: ESTree.Node, finding: Finding) {
      const { kind, mode } = finding;

      const diagnostic = Diagnostic.fromId({ node, messageId: kind });

      // A rewrite would drop the comments inside the expression.
      if (mode === 'report' || Arr.isReadonlyArrayNonEmpty(ctx.sourceCode.getCommentsInside(node))) {
        return yield* ctx.report(diagnostic);
      }

      const fix = yield* replaceWithNamespace(node, 'effect/Number', 'Num', finding.replacement);

      return yield* ctx.report(
        mode === 'fix'
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'replace', data: { api: kind }, fix }]),
      );
    });

    function reportFinding(node: ESTree.Node, finding: Opt.Option<Finding>) {
      return Opt.match(finding, { onNone: () => Effect.void, onSome: (found) => report(node, found) });
    }

    return Visitor.merge(
      Visitor.on('CallExpression', (node) =>
        Effect.flatMap(SourceCode.getScope(node), (scope) =>
          reportFinding(
            node,
            Opt.orElse(clampFinding(node, scope, ctx.sourceCode), () => reduceFinding(node, imports, ctx.sourceCode)),
          ),
        ),
      ),
      Visitor.on('BinaryExpression', (node) =>
        Effect.flatMap(SourceCode.getScope(node), (scope) =>
          reportFinding(node, roundFinding(node, scope, ctx.sourceCode)),
        ),
      ),
    );
  },
});
