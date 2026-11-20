import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';

import {
  argumentAt,
  isLiteral,
  parentOfType,
  staticPath,
  staticPropertyName,
  unwrapExpression,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import type { ImportBindings } from '../../schemas/imports';
import { onRuntimeImport, packageName } from './internal/package-imports';

type LibraryMessage = 'bigIntLibrary' | 'decimalLibrary' | 'rationalLibrary';

/**
 * Arbitrary-precision number packages and the message naming the Effect module that replaces each.
 */
const numberPackages: Readonly<Record<string, LibraryMessage>> = {
  'big-integer': 'bigIntLibrary',
  'big.js': 'decimalLibrary',
  'bignumber.js': 'decimalLibrary',
  'bn.js': 'bigIntLibrary',
  'currency.js': 'decimalLibrary',
  'decimal.js': 'decimalLibrary',
  'decimal.js-light': 'decimalLibrary',
  'fraction.js': 'rationalLibrary',
  fractional: 'rationalLibrary',
  jsbi: 'bigIntLibrary',
};

const numberTextMethods: ReadonlyArray<string> = ['toExponential', 'toFixed', 'toPrecision'];

const numericOperators: ReadonlyArray<string> = ['-', '*', '/', '%', '**'];

const fractionNames: ReadonlyArray<string> = ['den', 'denom', 'denominator', 'num', 'numer', 'numerator'];

function memberCallName(node: ESTree.Expression): Opt.Option<string> {
  return node.type === 'CallExpression' && node.callee.type === 'MemberExpression'
    ? staticPropertyName(node.callee)
    : Opt.none();
}

function hasPath(node: ESTree.Node, ...paths: ReadonlyArray<ReadonlyArray<string>>): boolean {
  return Opt.exists(staticPath(node), (path) =>
    Arr.some(
      paths,
      (expected) => path.length === expected.length && Arr.every(path, (part, i) => part === expected[i]),
    ),
  );
}

const isNumericNode = Match.type<ESTree.Expression>().pipe(
  Match.when({ type: 'Literal' }, ({ value }) => P.isNumber(value)),
  Match.when({ type: 'BinaryExpression' }, ({ operator }) => Arr.contains(numericOperators, operator)),
  Match.when({ type: 'UnaryExpression' }, ({ operator }) => operator === '-' || operator === '+'),
  Match.when(
    { type: 'CallExpression' },
    ({ callee }) =>
      Opt.exists(staticPath(callee), ([root]) => root === 'Math') ||
      hasPath(callee, ['Number'], ['parseFloat'], ['Number', 'parseFloat']),
  ),
  Match.orElse(() => false),
);

/**
 * Whether an expression is a number: a number literal, arithmetic other than `+`, a unary sign, or a call of `Math.*`,
 * `Number(…)` or `parseFloat(…)`.
 *
 * @param node Expression.
 */
function isNumericExpression(node: ESTree.Expression): boolean {
  return isNumericNode(unwrapExpression(node));
}

/**
 * Whether an expression is the decimal text of a number: `x.toFixed(2)`, `x.toPrecision(3)`, or `String(n)`,
 * `n.toString()` and `` `${n}` `` of a numeric expression.
 *
 * @param node Expression.
 */
function isNumberText(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  if (expression.type === 'TemplateLiteral') {
    return (
      expression.expressions.length === 1 &&
      Arr.every(expression.quasis, ({ value }) => value.cooked === '') &&
      Arr.every(expression.expressions, isNumericExpression)
    );
  }

  if (expression.type !== 'CallExpression') {
    return false;
  }

  if (Opt.exists(memberCallName(expression), (name) => Arr.contains(numberTextMethods, name))) {
    return true;
  }

  if (Opt.contains(memberCallName(expression), 'toString') && expression.callee.type === 'MemberExpression') {
    return (
      Arr.isReadonlyArrayEmpty(expression.arguments) &&
      isNumericExpression(expression.callee.object as ESTree.Expression)
    );
  }

  return hasPath(expression.callee, ['String']) && Opt.exists(argumentAt(expression, 0), isNumericExpression);
}

/**
 * Whether a call parses `x.toFixed(n)` back into a number: `parseFloat(…)`, `Number.parseFloat(…)` or `Number(…)`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function isToFixedRoundTrip(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  return (
    hasPath(node.callee, ['Number'], ['parseFloat'], ['Number', 'parseFloat']) &&
    // `Number` imported from Effect is the module, not the global.
    Opt.isNone(imports.path(node.callee)) &&
    Opt.exists(argumentAt(node, 0), (argument) => Opt.contains(memberCallName(unwrapExpression(argument)), 'toFixed'))
  );
}

/**
 * Whether an array pattern binds a numerator or denominator name, as in `const [num, den] = …`.
 *
 * @param node Split call, or the `.map(…)` call on its result.
 */
function bindsFraction(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    parentOfType(node, 'VariableDeclarator'),
    ({ id }) =>
      id.type === 'ArrayPattern' &&
      Arr.some(id.elements, (element) => element?.type === 'Identifier' && Arr.contains(fractionNames, element.name)),
  );
}

/**
 * The `.map(…)` call on a split result, as in `text.split('/').map(Number)`, or the split itself.
 *
 * @param node Split call.
 */
function splitResult(node: ESTree.CallExpression): ESTree.CallExpression {
  const { parent } = node;

  return parent.type === 'MemberExpression' &&
    parent.object === node &&
    Opt.contains(staticPropertyName(parent), 'map') &&
    parent.parent.type === 'CallExpression' &&
    parent.parent.callee === parent
    ? parent.parent
    : node;
}

export const preferEffectExactNumbers = Rule.define({
  name: 'prefer-effect-exact-numbers',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Prefer Effect BigDecimal, Rational, BigInt and Number over arbitrary-precision libraries and numbers handled as text in Effect projects.',
    messages: {
      bigIntLibrary:
        'Use native bigint with BigInt from effect instead of {{source}}: effect/BigInt adds gcd, lcm, sqrt, nthRoot and division that returns an Option.',
      decimalLibrary:
        'Use BigDecimal from effect instead of {{source}}: it keeps decimals exact as a bigint and a scale, and Schema.BigDecimal decodes and encodes them.',
      decimalSplit:
        "Splitting a number's text on '.' reads its digits by hand. Use BigDecimal from effect: BigDecimal.fromNumber or fromString keep the exact digits and scale, and BigDecimal.truncate, round and remainder give the integer and fraction parts.",
      fractionSplit:
        "Splitting a fraction on '/' into a numerator and a denominator parses it by hand. Use Rational.fromString from effect, which keeps the fraction exact and normalizes its sign.",
      rationalLibrary:
        'Use Rational from effect instead of {{source}}: it keeps fractions exact as bigint numerators and denominators.',
      toFixedRoundTrip:
        'Rounding a number through toFixed text and back is hand-written. Use Num.round(x, digits) from effect/Number, or BigDecimal.round when the value must stay an exact decimal, such as money.',
    },
    url: 'https://effect.website/docs/v4/api/effect/BigDecimal',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    type MessageId = LibraryMessage | 'decimalSplit' | 'fractionSplit' | 'toFixedRoundTrip';

    function report(node: ESTree.Node, messageId: MessageId, data?: Record<string, string>) {
      return ctx.report(Diagnostic.fromId({ node, messageId, data }));
    }

    /**
     * The string a call splits on `separator`: `subject.split(separator)` or `Str.split(subject, separator)`.
     *
     * @param node Call.
     * @param separator Separator literal.
     */
    function splitSubject(node: ESTree.CallExpression, separator: string): Opt.Option<ESTree.Expression> {
      if (imports.isApi(node.callee, 'String', 'split')) {
        return Opt.exists(argumentAt(node, 1), isLiteral(separator)) ? argumentAt(node, 0) : Opt.none();
      }

      return node.callee.type === 'MemberExpression' &&
        Opt.contains(staticPropertyName(node.callee), 'split') &&
        Opt.exists(argumentAt(node, 0), isLiteral(separator))
        ? Opt.some(node.callee.object as ESTree.Expression)
        : Opt.none();
    }

    function checkCall(node: ESTree.CallExpression) {
      if (isToFixedRoundTrip(node, imports)) {
        return report(node, 'toFixedRoundTrip');
      }

      if (Opt.exists(splitSubject(node, '.'), isNumberText)) {
        return report(node, 'decimalSplit');
      }

      return Opt.isSome(splitSubject(node, '/')) && bindsFraction(splitResult(node))
        ? report(node, 'fractionSplit')
        : Effect.void;
    }

    return Visitor.merge(
      onRuntimeImport((source) =>
        Opt.match(R.get(numberPackages, packageName(source.value)), {
          onNone: () => Effect.void,
          onSome: (messageId) => report(source, messageId, { source: source.value }),
        }),
      ),
      Visitor.on('CallExpression', checkCall),
      // `+x.toFixed(2)`
      Visitor.on('UnaryExpression', (node) =>
        node.operator === '+' && Opt.contains(memberCallName(unwrapExpression(node.argument)), 'toFixed')
          ? report(node, 'toFixedRoundTrip')
          : Effect.void,
      ),
    );
  },
});
