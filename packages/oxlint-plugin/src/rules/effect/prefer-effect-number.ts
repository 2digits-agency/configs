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
import * as Num from 'effect/Number';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import {
  argumentAt,
  isConstDeclaration,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
} from '../../internal/ast';
import { argumentText, namespaceImport } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isGlobalIn, isImportedApiIn, lookupVariable, soleDefinition } from '../../internal/scope';
import type { ImportBindings } from '../../schemas/imports';
import { BoundName, MinMax, TypeScriptFile } from '../../schemas/names';
import { namespaceAlias } from './internal/import-style';

type Kind =
  | 'clamp'
  | 'round'
  | 'sumAll'
  | 'multiplyAll'
  | 'increment'
  | 'decrement'
  | 'unchangedStep'
  | 'order'
  | 'between'
  | 'divide'
  | 'extreme'
  | 'parse';

/**
 * `fix` keeps the behavior, `suggest` changes it in edge cases, `report` has no safe rewrite.
 */
type Mode = 'fix' | 'suggest' | 'report';

// The Effect module behind each namespace. The fix imports it under the alias the import style rules use: `Num` for Number.
const namespaceModules = { num: 'Number', opt: 'Option', order: 'Order' } as const;

type Namespace = keyof typeof namespaceModules;

/**
 * The local name of each namespace a replacement uses, after the fix adds the missing imports.
 */
type Namespaces = Readonly<Record<Namespace, string>>;

interface Finding {
  readonly kind: Kind;
  readonly mode: Mode;
  /**
   * The node to report and replace, when it is not the visited node.
   */
  readonly target?: ESTree.Node;
  readonly data?: Readonly<Record<string, string>>;
  /**
   * Namespaces the replacement uses besides `num`.
   */
  readonly extra?: ReadonlyArray<Exclude<Namespace, 'num'>>;
  readonly replacement: (namespaces: Namespaces) => string;
}

/**
 * What a check reads from the file: its source, its imports, and the scope of the visited node.
 */
interface Env {
  readonly sourceCode: OxlintSourceCode;
  readonly imports: ImportBindings;
  readonly scope: OxlintScope;
}

type Pair = readonly [ESTree.Expression, ESTree.Expression];

const isMinMax = Schema.is(MinMax);

const isBoundName = Schema.is(BoundName);

/*
 * Kinds whose fix is exact for numbers but not for every value an untyped parameter can hold: `'5' + 1` concatenates,
 * `'10' - '2'` subtracts and `'100' >= 0` coerces, where Number.increment, Number.Order and Number.between do not, and
 * `--n` also steps a bigint, where Number.decrement throws. TypeScript rejects those values in the fixed code, so the fix
 * is only downgraded in JavaScript files.
 */
const numbersOnly: ReadonlySet<Kind> = new Set(['increment', 'decrement', 'order', 'between']);

const isTypeScriptFile = Schema.is(TypeScriptFile);

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
 * Which of `min` and `max` a call names, on the global `Math` or Effect's Number module, with its two arguments.
 *
 * @param node Expression.
 * @param env File being linted.
 */
function minMaxCall(node: ESTree.Expression, env: Env): Opt.Option<readonly ['min' | 'max', Pair]> {
  const call = unwrapExpression(node);

  if (call.type !== 'CallExpression' || call.optional || call.arguments.length !== 2) {
    return Opt.none();
  }

  const callee = call.callee;

  const member =
    callee.type === 'MemberExpression' && !callee.optional && isGlobalIn(env.scope, callee.object, 'Math')
      ? staticPropertyName(callee)
      : Opt.filter(env.imports.member(callee, 'Number'), () => isImportedApiIn(env.sourceCode, callee));

  return Opt.all([Opt.filter(member, isMinMax), argumentAt(call, 0), argumentAt(call, 1)]).pipe(
    Opt.map(([name, first, second]) => [name, [first, second]] as const),
  );
}

/**
 * The arguments of `node` when it calls the `min` or `max` named by `member`.
 *
 * @param node Expression.
 * @param member `min` or `max`.
 * @param env File being linted.
 */
function minMaxPair(node: ESTree.Expression, member: 'min' | 'max', env: Env): Opt.Option<Pair> {
  return Opt.flatMap(minMaxCall(node, env), ([name, pair]) => (name === member ? Opt.some(pair) : Opt.none()));
}

/**
 * `Math.min(hi, Math.max(lo, x))` or `Math.max(lo, Math.min(hi, x))`, with the arguments of each call in either order,
 * and the same with Effect's `Num.min` and `Num.max`.
 *
 * @param node Outer call.
 * @param env File being linted.
 */
function clampFinding(node: ESTree.CallExpression, env: Env): Opt.Option<Finding> {
  const { sourceCode } = env;

  return minMaxCall(node, env).pipe(
    Opt.flatMap(([outer, [first, second]]) => {
      const inner = outer === 'min' ? 'max' : 'min';

      return minMaxPair(second, inner, env).pipe(
        Opt.map((pair) => [first, pair] as const),
        Opt.orElse(() => Opt.map(minMaxPair(first, inner, env), (pair) => [second, pair] as const)),
        Opt.flatMap(([outerBound, [innerFirst, innerSecond]]) => {
          /*
           * With `Math.min` outside, `Math.max(lo, x)` is symmetric and either inner argument can be the value. With
           * `Math.max` outside, taking the wrong one as the value gives a fix that returns `x` below the minimum, so
           * an unclear value is reported without a fix.
           */
          const unclearValue = isBoundLike(innerFirst) === isBoundLike(innerSecond);

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
            mode:
              outer === 'max' && unclearValue
                ? 'report'
                : reordersSafely([outerBound, innerFirst, innerSecond])
                  ? 'fix'
                  : 'suggest',
            replacement: ({ num }) =>
              `${num}.clamp(${argumentText(sourceCode, value)}, { minimum: ${argumentText(sourceCode, minimum)}, maximum: ${argumentText(sourceCode, maximum)} })`,
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
        (power) =>
          Num.between(power, { minimum: 1, maximum: maxExactPowerOfTen }) &&
          Opt.contains(numericValue(factor), 10 ** power),
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
    Opt.flatMap(({ left, right }): Opt.Option<readonly [ESTree.Expression, ESTree.Expression, boolean]> =>
      isSameFactor(right, divisor, sourceCode)
        ? Opt.some([left, right, false] as const)
        : isSameFactor(left, divisor, sourceCode)
          ? Opt.some([right, left, true] as const)
          : Opt.none(),
    ),
    Opt.flatMap(([value, factor, factorFirst]) =>
      Opt.map(precisionOf(factor, scope), (precision) => {
        const precisionText = P.isNumber(precision) ? String(precision) : argumentText(sourceCode, precision);

        /*
         * The original evaluates the precision twice and the fix once, after the value. A factor before a value with
         * effects, as in `10 ** n * next()`, would read `n` after `next()` instead of before it.
         */
        const mode: Mode =
          P.isNumber(precision) || (isSideEffectFree(precision) && (!factorFirst || isSideEffectFree(value)))
            ? 'fix'
            : 'report';

        return {
          kind: 'round',
          mode,
          replacement: ({ num }) => `${num}.round(${argumentText(sourceCode, value)}, ${precisionText})`,
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
    replacement: ({ num }) =>
      Opt.match(collection, {
        onNone: () => `${num}.${kind}`,
        onSome: (items) => `${num}.${kind}(${argumentText(sourceCode, items)})`,
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
 * Whether a parameter is a plain name, untyped or typed as `number`.
 *
 * @param node Parameter.
 */
function isNumberParameter(node: ESTree.Node): node is ESTree.BindingIdentifier {
  return (
    node.type === 'Identifier' &&
    (P.isNullish(node.typeAnnotation) || node.typeAnnotation.typeAnnotation.type === 'TSNumberKeyword')
  );
}

/**
 * The parameters and returned expression of an arrow such as `(a, b) => a - b`, without a return type or type
 * parameters.
 *
 * @param node Expression.
 * @param arity Number of parameters.
 */
function arrowBody(
  node: ESTree.Node,
  arity: number,
): Opt.Option<readonly [ReadonlyArray<ESTree.BindingIdentifier>, ESTree.Expression]> {
  if (
    node.type !== 'ArrowFunctionExpression' ||
    node.async ||
    P.isNotNullish(node.returnType) ||
    P.isNotNullish(node.typeParameters) ||
    node.params.length !== arity ||
    node.body.type === 'BlockStatement'
  ) {
    return Opt.none();
  }

  const params = Arr.filter(node.params, isNumberParameter);

  return params.length === arity ? Opt.some([params, unwrapExpression(node.body)] as const) : Opt.none();
}

function isIdentifierNamed(node: ESTree.Expression, name: string): boolean {
  const expression = unwrapExpression(node);

  return expression.type === 'Identifier' && expression.name === name;
}

type Step = readonly ['+' | '-', 'new' | 'old'];

/**
 * The step a one-parameter arrow applies to its parameter: `n + 1`, `++n` and `n += 1` return `n + 1`, and `n++`
 * returns `n` unchanged, because a postfix update returns the value before it.
 *
 * @param body Arrow body.
 * @param name Parameter name.
 */
function stepOf(body: ESTree.Expression, name: string): Opt.Option<Step> {
  if (body.type === 'BinaryExpression') {
    return binaryStep(body, name);
  }

  if (body.type === 'AssignmentExpression') {
    return assignmentStep(body, name);
  }

  return body.type === 'UpdateExpression' && body.argument.type === 'Identifier' && body.argument.name === name
    ? Opt.some([body.operator === '++' ? '+' : '-', body.prefix ? 'new' : 'old'])
    : Opt.none();
}

// `1 + n` is left alone because it concatenates strings the other way round.
function binaryStep(body: ESTree.Expression, name: string): Opt.Option<Step> {
  if (body.type !== 'BinaryExpression' || body.left.type === 'PrivateIdentifier') {
    return Opt.none();
  }

  return (body.operator === '+' || body.operator === '-') &&
    isIdentifierNamed(body.left, name) &&
    Opt.contains(numericValue(body.right), 1)
    ? Opt.some([body.operator, 'new'])
    : Opt.none();
}

function assignmentStep(body: ESTree.AssignmentExpression, name: string): Opt.Option<Step> {
  return (body.operator === '+=' || body.operator === '-=') &&
    body.left.type === 'Identifier' &&
    body.left.name === name &&
    Opt.contains(numericValue(body.right), 1)
    ? Opt.some([body.operator === '+=' ? '+' : '-', 'new'])
    : Opt.none();
}

/**
 * `(n) => n + 1`, `(n) => ++n` or `(n) => n += 1`, and the same with `- 1`. `Num.increment` is `(n) => n + 1`, so the
 * fix keeps the result. `(n) => n++` returns `n` unchanged, so it is reported as a likely bug without a fix.
 *
 * @param node Arrow function.
 */
function stepFinding(node: ESTree.ArrowFunctionExpression): Opt.Option<Finding> {
  return arrowBody(node, 1).pipe(
    Opt.flatMap(([[param], body]) =>
      P.isUndefined(param) ? Opt.none() : Opt.map(stepOf(body, param.name), (step) => [step, param, body] as const),
    ),
    Opt.map(([[operator, result], param, body]): Finding => {
      const kind = operator === '+' ? 'increment' : 'decrement';

      /*
       * `name + 1` is valid TypeScript for a string, so without a `number` annotation the `+` forms may concatenate.
       * `++n`, `n - 1` and `n -= 1` do not type-check for strings.
       */
      const concatenates = operator === '+' && body.type !== 'UpdateExpression' && P.isNullish(param.typeAnnotation);

      return result === 'new'
        ? { kind, mode: concatenates ? 'suggest' : 'fix', replacement: ({ num }) => `${num}.${kind}` }
        : {
            kind: 'unchangedStep',
            mode: 'report',
            data: { step: operator === '+' ? 'n++' : 'n--', api: `Num.${kind}` },
            replacement: () => '',
          };
    }),
  );
}

/**
 * The comparator a sort call takes: the argument of a native `.sort` or `.toSorted`, or the last argument of
 * `Arr.sort`.
 *
 * @param node Call.
 * @param env File being linted.
 */
function sortComparator(node: ESTree.CallExpression, env: Env): Opt.Option<ESTree.Expression> {
  const callee = node.callee;

  if (env.imports.isApi(callee, 'Array', 'sort') && isImportedApiIn(env.sourceCode, callee)) {
    return node.arguments.length === 1 || node.arguments.length === 2
      ? argumentAt(node, node.arguments.length - 1)
      : Opt.none();
  }

  return !node.optional &&
    node.arguments.length === 1 &&
    callee.type === 'MemberExpression' &&
    !callee.optional &&
    Opt.exists(staticPropertyName(callee), (name) => name === 'sort' || name === 'toSorted') &&
    Opt.isNone(env.imports.path(callee))
    ? argumentAt(node, 0)
    : Opt.none();
}

/**
 * `(a, b) => a - b` or `(a, b) => b - a` passed to a sort. Number.Order sorts numbers the same way, except NaN, which
 * it orders first.
 *
 * @param node Sort call.
 * @param env File being linted.
 */
function orderFinding(node: ESTree.CallExpression, env: Env): Opt.Option<Finding> {
  return sortComparator(node, env).pipe(
    Opt.flatMap((comparator) =>
      arrowBody(comparator, 2).pipe(
        Opt.flatMap(([[first, second], body]) => {
          if (
            P.isUndefined(first) ||
            P.isUndefined(second) ||
            first.name === second.name ||
            body.type !== 'BinaryExpression' ||
            body.operator !== '-'
          ) {
            return Opt.none();
          }

          if (isIdentifierNamed(body.left, first.name) && isIdentifierNamed(body.right, second.name)) {
            return Opt.some({
              kind: 'order',
              mode: 'fix',
              target: comparator,
              data: { order: 'Num.Order' },
              replacement: ({ num }) => `${num}.Order`,
            } satisfies Finding);
          }

          return isIdentifierNamed(body.left, second.name) && isIdentifierNamed(body.right, first.name)
            ? Opt.some({
                kind: 'order',
                mode: 'fix',
                target: comparator,
                data: { order: 'Order.flip(Num.Order)' },
                extra: ['order'],
                replacement: ({ num, order }) => `${order}.flip(${num}.Order)`,
              } satisfies Finding)
            : Opt.none();
        }),
      ),
    ),
  );
}

/**
 * The two sides of an ordering comparison, smaller first: `a <= b` and `b >= a` both give `[a, b]`.
 */
interface Comparison {
  readonly small: ESTree.Expression;
  readonly big: ESTree.Expression;
}

function comparison(node: ESTree.Expression, strict: boolean): Opt.Option<Comparison> {
  const expression = unwrapExpression(node);

  if (expression.type !== 'BinaryExpression' || expression.left.type === 'PrivateIdentifier') {
    return Opt.none();
  }

  const { operator, left, right } = expression;

  if (operator === (strict ? '<' : '<=')) {
    return Opt.some({ small: left, big: right });
  }

  return operator === (strict ? '>' : '>=') ? Opt.some({ small: right, big: left }) : Opt.none();
}

/**
 * Which bound a comparison sets for the value with source text `value`: `x <= hi` sets the upper bound, and in the
 * negated form `x < lo` sets the lower one.
 *
 * @param check Comparison.
 * @param value Source text of the value.
 * @param strict Whether the comparison is the negated, strict form.
 * @param sourceCode Source of the file.
 */
function boundOf(
  check: Comparison,
  value: string,
  strict: boolean,
  sourceCode: OxlintSourceCode,
): Opt.Option<readonly ['lower' | 'upper', ESTree.Expression]> {
  if (sourceCode.getText(unwrapExpression(check.small)) === value) {
    return Opt.some([strict ? 'lower' : 'upper', check.big]);
  }

  return sourceCode.getText(unwrapExpression(check.big)) === value
    ? Opt.some([strict ? 'upper' : 'lower', check.small])
    : Opt.none();
}

/**
 * The value and its bounds when two comparisons set opposite bounds for `value`.
 *
 * @param value Candidate value, an operand of `first`.
 * @param first First comparison.
 * @param second Second comparison.
 * @param strict Whether the comparisons are the negated, strict form.
 * @param sourceCode Source of the file.
 */
function range(
  value: ESTree.Expression,
  first: Comparison,
  second: Comparison,
  strict: boolean,
  sourceCode: OxlintSourceCode,
): Opt.Option<readonly [ESTree.Expression, ESTree.Expression, ESTree.Expression]> {
  const text = sourceCode.getText(unwrapExpression(value));

  return Opt.zipWith(
    boundOf(first, text, strict, sourceCode),
    boundOf(second, text, strict, sourceCode),
    ([firstSide, firstBound], [secondSide, secondBound]) =>
      firstSide === secondSide
        ? Opt.none()
        : Opt.some(
            firstSide === 'lower'
              ? ([value, firstBound, secondBound] as const)
              : ([value, secondBound, firstBound] as const),
          ),
  ).pipe(Opt.flatten);
}

// `c >= 'a' && c <= 'z'` compares strings, and `10n` is a bigint, which Number.between does not take.
function isNonNumberLiteral(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  return (
    expression.type === 'TemplateLiteral' ||
    (expression.type === 'Literal' && (P.isString(expression.value) || P.isBigInt(expression.value)))
  );
}

/**
 * `x >= lo && x <= hi` in any operand order, or the negated `x < lo || x > hi`.
 *
 * @param node Logical expression.
 * @param sourceCode Source of the file.
 */
function betweenFinding(node: ESTree.LogicalExpression, sourceCode: OxlintSourceCode): Opt.Option<Finding> {
  if (node.operator !== '&&' && node.operator !== '||') {
    return Opt.none();
  }

  const strict = node.operator === '||';

  return Opt.all([comparison(node.left, strict), comparison(node.right, strict)]).pipe(
    Opt.flatMap(([first, second]) =>
      Arr.findFirst(
        Arr.filter([first.small, first.big], (value) => Opt.isNone(numericValue(value))),
        (value) => range(value, first, second, strict, sourceCode),
      ),
    ),
    Opt.filter((operands): boolean => !Arr.some(operands, isNonNumberLiteral)),
    /*
     * Without types, `from <= date && date <= to` may compare strings or Dates. A number literal bound makes the
     * comparison numeric; bounds named like `lower` and `upper` only make it likely.
     */
    Opt.filter(([, minimum, maximum]) => Arr.every([minimum, maximum], isBoundLike)),
    Opt.map(
      ([value, minimum, maximum]) =>
        ({
          kind: 'between',
          // The original reads the value twice and may skip the second bound.
          /*
           * Number.Order puts NaN below every number. For a NaN value, `x < lo || x > hi` is false where
           * `!Num.between` is true, and a NaN lower bound passes Num.between where `x >= lo` fails, so only the `&&`
           * form with a number literal lower bound is exact.
           */
          mode: Arr.every([value, minimum, maximum], isSideEffectFree)
            ? !strict && Opt.isSome(numericValue(minimum))
              ? 'fix'
              : 'suggest'
            : 'report',
          replacement: ({ num }) =>
            `${strict ? '!' : ''}${num}.between(${argumentText(sourceCode, value)}, { minimum: ${argumentText(sourceCode, minimum)}, maximum: ${argumentText(sourceCode, maximum)} })`,
        }) satisfies Finding,
    ),
  );
}

/**
 * The divisor a test compares with zero: `b` in `b === 0` or `0 !== b`, with whether the test is negated.
 *
 * @param node Test.
 */
function isZero(node: ESTree.Expression): boolean {
  return Opt.contains(numericValue(node), 0);
}

function zeroCheck(node: ESTree.Expression): Opt.Option<readonly [ESTree.Expression, boolean]> {
  const test = unwrapExpression(node);

  if (test.type !== 'BinaryExpression' || (test.operator !== '===' && test.operator !== '!==')) {
    return Opt.none();
  }

  const divisor = isZero(test.right) ? Opt.some(test.left) : isZero(test.left) ? Opt.some(test.right) : Opt.none();

  return divisor.pipe(
    Opt.filter((side) => Opt.isNone(numericValue(side))),
    Opt.map((side) => [side, test.operator === '!=='] as const),
  );
}

/**
 * `b === 0 ? fallback : a / b` or `b !== 0 ? a / b : fallback`. Number.divide checks `b === 0` too.
 *
 * @param node Conditional.
 * @param sourceCode Source of the file.
 */
function divideFinding(node: ESTree.ConditionalExpression, sourceCode: OxlintSourceCode): Opt.Option<Finding> {
  return zeroCheck(node.test).pipe(
    Opt.flatMap(([divisor, negated]) => {
      const [fallback, quotient] = negated ? [node.alternate, node.consequent] : [node.consequent, node.alternate];

      const division = unwrapExpression(quotient);

      if (
        division.type !== 'BinaryExpression' ||
        division.operator !== '/' ||
        sourceCode.getText(unwrapExpression(division.right)) !== sourceCode.getText(unwrapExpression(divisor))
      ) {
        return Opt.none();
      }

      const dividend = division.left;

      const fallbackText =
        unwrapExpression(fallback).type === 'ObjectExpression'
          ? `(${sourceCode.getText(fallback)})`
          : argumentText(sourceCode, fallback);

      return Opt.some({
        kind: 'divide',
        // The fix evaluates the dividend before the divisor, and the divisor once.
        // An `await` or `yield` in the fallback would end up in a plain arrow, which is a syntax error.
        mode:
          isSideEffectFree(dividend) &&
          isSideEffectFree(divisor) &&
          !walkNodes(fallback, (inner) => inner.type === 'AwaitExpression' || inner.type === 'YieldExpression')
            ? 'fix'
            : 'report',
        extra: ['opt'],
        replacement: ({ num, opt }) =>
          `${opt}.getOrElse(${num}.divide(${argumentText(sourceCode, dividend)}, ${argumentText(sourceCode, divisor)}), () => ${fallbackText})`,
      } satisfies Finding);
    }),
  );
}

/**
 * `Math.max(...xs)` or `Math.min(...xs)`. Arr.max needs a non-empty array and skips NaN, so this is only reported.
 *
 * @param node Call.
 * @param env File being linted.
 */
function extremeFinding(node: ESTree.CallExpression, env: Env): Opt.Option<Finding> {
  const callee = node.callee;

  if (
    node.optional ||
    node.arguments.length !== 1 ||
    !Opt.exists(Arr.head(node.arguments), (argument) => argument.type === 'SpreadElement') ||
    callee.type !== 'MemberExpression' ||
    callee.optional ||
    !isGlobalIn(env.scope, callee.object, 'Math')
  ) {
    return Opt.none();
  }

  return staticPropertyName(callee).pipe(
    Opt.filter(isMinMax),
    Opt.map(
      (member) =>
        ({
          kind: 'extreme',
          mode: 'report',
          data: { api: `Arr.${member}`, math: `Math.${member}`, empty: member === 'max' ? '-Infinity' : 'Infinity' },
          replacement: () => '',
        }) satisfies Finding,
    ),
  );
}

/**
 * The function a conversion such as `Number(s)` or `parseFloat(s)` calls.
 *
 * @param node Expression.
 * @param sourceCode Source of the file.
 */
function conversionName(node: ESTree.Node, sourceCode: OxlintSourceCode): Opt.Option<string> {
  const call = node.type === 'CallExpression' ? node : Opt.getOrNull(Opt.none<ESTree.CallExpression>());

  if (P.isNull(call) || call.optional || call.arguments.length !== 1 || call.callee.type !== 'Identifier') {
    return Opt.none();
  }

  const { name } = call.callee;

  return Opt.liftPredicate(
    name,
    (candidate) =>
      (candidate === 'Number' || candidate === 'parseFloat') &&
      isGlobalIn(sourceCode.getScope(call), call.callee, candidate),
  );
}

/**
 * `Number.isNaN(Number(s))` or `isNaN(n)` where `const n = Number(s)`, also with `parseFloat`. Number.parse returns
 * none for `''` where `Number('')` is 0, so this is only reported.
 *
 * @param node Call.
 * @param env File being linted.
 */
function parseFinding(node: ESTree.CallExpression, env: Env): Opt.Option<Finding> {
  const callee = node.callee;

  const isNaNCheck =
    !node.optional &&
    node.arguments.length === 1 &&
    (isGlobalIn(env.scope, callee, 'isNaN') ||
      (callee.type === 'MemberExpression' &&
        !callee.optional &&
        isGlobalIn(env.scope, callee.object, 'Number') &&
        Opt.contains(staticPropertyName(callee), 'isNaN')));

  if (!isNaNCheck) {
    return Opt.none();
  }

  const converted = argumentAt(node, 0).pipe(
    Opt.map(unwrapExpression),
    Opt.flatMap((argument) =>
      argument.type === 'Identifier'
        ? soleDefinition(lookupVariable(env.sourceCode, argument, argument.name)).pipe(
            Opt.flatMap(({ node: declarator }) =>
              // A `let` may hold another value by the time it is checked.
              declarator.type === 'VariableDeclarator' &&
              P.isNotNullish(declarator.init) &&
              isConstDeclaration(declarator.parent)
                ? Opt.some(unwrapExpression(declarator.init))
                : Opt.none(),
            ),
          )
        : Opt.some(argument),
    ),
  );

  return converted.pipe(
    Opt.flatMap((conversion) => conversionName(conversion, env.sourceCode)),
    Opt.map(
      (name) =>
        ({
          kind: 'parse',
          mode: 'report',
          data: { conversion: `${name}(…)` },
          replacement: () => '',
        }) satisfies Finding,
    ),
  );
}

/**
 * Prefer Effect Number helpers over hand-written clamping, rounding, ranges, sums, products, steps, comparators,
 * guarded division, spread extremes and NaN-checked parsing in Effect files.
 */
export const preferEffectNumber = Rule.define({
  name: 'prefer-effect-number',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Prefer Effect Number helpers over hand-written clamping, rounding, ranges, sums, products, comparators and parsing in Effect files.',
    messages: {
      clamp: 'Use Number.clamp from Effect instead of nesting min and max.',
      round: 'Use Number.round from Effect instead of scaling Math.round by a power of ten.',
      sumAll: 'Use Number.sumAll from Effect instead of summing with reduce.',
      multiplyAll:
        'Use Number.multiplyAll from Effect instead of multiplying with reduce. It returns 0 at the first 0, even when NaN or Infinity follows.',
      increment: 'Use Number.increment from Effect instead of (n) => n + 1.',
      decrement: 'Use Number.decrement from Effect instead of (n) => n - 1.',
      unchangedStep:
        'This callback returns n unchanged, because {{step}} returns the value before the update. Use {{api}} to return the next value.',
      order: 'Use {{order}} from Effect instead of a comparator that subtracts. It sorts the same, except NaN.',
      between: 'Use Number.between from Effect instead of comparing with both bounds.',
      divide: 'Use Number.divide from Effect, which returns none for a zero divisor, instead of checking for 0 first.',
      extreme:
        'Use {{api}} with Number.Order instead of {{math}} over a spread. It needs a non-empty array, where {{math}} of an empty array is {{empty}}, and it skips NaN.',
      parse:
        "Use Number.parse from Effect, which returns an Option, instead of {{conversion}} with a NaN check. Number.parse returns none for '' and '12px'.",
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

    const typed = isTypeScriptFile(ctx.filename);

    const report = Effect.fnUntraced(function* (visited: ESTree.Node, finding: Finding) {
      const { kind } = finding;

      const mode = !typed && finding.mode === 'fix' && numbersOnly.has(kind) ? 'suggest' : finding.mode;

      const node = finding.target ?? visited;

      const diagnostic = Diagnostic.fromId({ node, messageId: kind, data: finding.data ?? {} });

      // A rewrite would drop the comments inside the expression.
      if (mode === 'report' || Arr.isReadonlyArrayNonEmpty(ctx.sourceCode.getCommentsInside(node))) {
        return yield* ctx.report(diagnostic);
      }

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      const imported = yield* Effect.forEach(
        ['num', ...(finding.extra ?? [])] as const,
        (namespace) =>
          Effect.map(
            namespaceImport(node, `effect/${namespaceModules[namespace]}`, namespaceAlias(namespaceModules[namespace])),
            (found) => [namespace, found] as const,
          ),
        { concurrency: 1 },
      );

      const names = R.map(namespaceModules, (module, namespace) =>
        Opt.match(
          Arr.findFirst(imported, ([used]) => used === namespace),
          { onNone: () => namespaceAlias(module), onSome: ([, found]) => found.name },
        ),
      );

      const fix = Diagnostic.composeFixes(
        ...Arr.flatMap(imported, ([, found]) => Opt.toArray(found.fix)),
        Diagnostic.replaceText(node, finding.replacement(names)),
      );

      return yield* ctx.report(
        mode === 'fix'
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'replace', data: { api: kind }, fix }]),
      );
    });

    function reportFinding(node: ESTree.Node, finding: Opt.Option<Finding>) {
      return Opt.match(finding, { onNone: () => Effect.void, onSome: (found) => report(node, found) });
    }

    function env(node: ESTree.Node) {
      return Effect.map(SourceCode.getScope(node), (scope): Env => ({ sourceCode: ctx.sourceCode, imports, scope }));
    }

    return Visitor.merge(
      Visitor.on('CallExpression', (node) =>
        Effect.flatMap(env(node), (found) =>
          reportFinding(
            node,
            clampFinding(node, found).pipe(
              Opt.orElse(() => reduceFinding(node, imports, ctx.sourceCode)),
              Opt.orElse(() => orderFinding(node, found)),
              Opt.orElse(() => extremeFinding(node, found)),
              Opt.orElse(() => parseFinding(node, found)),
            ),
          ),
        ),
      ),
      Visitor.on('BinaryExpression', (node) =>
        Effect.flatMap(SourceCode.getScope(node), (scope) =>
          reportFinding(node, roundFinding(node, scope, ctx.sourceCode)),
        ),
      ),
      Visitor.on('ArrowFunctionExpression', (node) => reportFinding(node, stepFinding(node))),
      Visitor.on('LogicalExpression', (node) => reportFinding(node, betweenFinding(node, ctx.sourceCode))),
      Visitor.on('ConditionalExpression', (node) => reportFinding(node, divideFinding(node, ctx.sourceCode))),
    );
  },
});
