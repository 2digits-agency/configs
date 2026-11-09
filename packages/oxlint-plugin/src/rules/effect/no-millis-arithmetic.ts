import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type Definition, type ESTree } from 'effect-oxlint';
import type * as DateTime from 'effect/DateTime';
import type * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';

import {
  enclosingFunction,
  isConstDeclaration,
  isLiteral,
  isWrapperExpressionType,
  parentOf,
  staticPropertyName,
  unwrapExpression,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isImportedApi, resolveVariable, soleDefinition } from '../../internal/scope';
import { isForeignCallback } from './internal/callbacks';
import { millisName, type MillisKind } from './internal/duration';

type DateTimeApi = `DateTime.${keyof typeof DateTime}`;

type DurationApi = `Duration.${keyof typeof Duration}`;

const isArithmeticOperator = Schema.is(Schema.Literals(['*', '+', '-', '/']));

const durationSuggestions: Readonly<Record<string, DurationApi>> = {
  '!==': 'Duration.equals',
  '*': 'Duration.times',
  '+': 'Duration.sum',
  '-': 'Duration.subtract',
  '/': 'Duration.divide',
  '<': 'Duration.isLessThan',
  '<=': 'Duration.isLessThanOrEqualTo',
  '===': 'Duration.equals',
  '>': 'Duration.isGreaterThan',
  '>=': 'Duration.isGreaterThanOrEqualTo',
};

const instantSuggestions: Readonly<Record<string, DateTimeApi>> = {
  '!==': 'DateTime.Equivalence',
  '+': 'DateTime.addDuration',
  '-': 'DateTime.subtractDuration',
  '<': 'DateTime.isLessThan',
  '<=': 'DateTime.isLessThanOrEqualTo',
  '===': 'DateTime.Equivalence',
  '>': 'DateTime.isGreaterThan',
  '>=': 'DateTime.isGreaterThanOrEqualTo',
};

const signChecks = 'Duration.isPositive, Duration.isNegative or Duration.isZero';

// Comparing a duration with zero checks its sign.
const zeroSuggestions: Readonly<Record<string, string>> = {
  '!==': 'Duration.isZero' satisfies DurationApi,
  '<': signChecks,
  '<=': signChecks,
  '===': 'Duration.isZero' satisfies DurationApi,
  '>': signChecks,
  '>=': signChecks,
};

// Tracing stops after a few `const` hops; longer chains are not worth the lookups.
const maxTraceDepth = 4;

interface Operands {
  readonly left: Opt.Option<MillisKind>;
  readonly right: Opt.Option<MillisKind>;
}

function isStringy(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  if (expression.type === 'TemplateLiteral' || (expression.type === 'Literal' && P.isString(expression.value))) {
    return true;
  }

  return (
    expression.type === 'BinaryExpression' &&
    expression.operator === '+' &&
    (isStringy(expression.left) || isStringy(expression.right))
  );
}

// `timeoutMs === undefined` and `startMs !== null` check presence, not time.
function isNonNumericLiteral(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  return (
    (expression.type === 'Identifier' && expression.name === 'undefined') ||
    (expression.type === 'Literal' && !P.isNumber(expression.value))
  );
}

/**
 * Whether a binding mirrors someone else's field or callback signature: destructured from an object (`const {
 * durationMs } = response`) or a parameter of a callback that a non-Effect API calls.
 *
 * @param definition Binding definition.
 * @param imports Import bindings of the file.
 */
function isForeignBinding(definition: Definition, imports: ImportBindings): boolean {
  const parent = definition.name.parent;

  const binding = parent.type === 'AssignmentPattern' ? parent.parent : parent;

  if (binding.type === 'Property') {
    return true;
  }

  return (
    definition.type === 'Parameter' &&
    Opt.exists(enclosingFunction(definition.name), (owner) => isForeignCallback(owner, imports))
  );
}

function isInstant(kind: Opt.Option<MillisKind>): boolean {
  return Opt.contains(kind, 'instant');
}

/**
 * The kind of a `+`, `-`, `*` or `/` result: two instants subtract to a duration, an instant plus a duration or an
 * instant minus a duration stays an instant, and everything else is a duration.
 *
 * @param operator Arithmetic operator.
 * @param operands Kinds of both operands.
 */
function resultKind(operator: string, operands: Operands): MillisKind {
  const { left, right } = operands;

  if (operator === '+') {
    return isInstant(left) === isInstant(right) ? 'duration' : 'instant';
  }

  return operator === '-' && isInstant(left) && !isInstant(right) ? 'instant' : 'duration';
}

function suggestion(node: ESTree.BinaryExpression, operands: Operands): string {
  const instant = isInstant(operands.left) || isInstant(operands.right);

  // `nowMs - startMs` and `Date.now() - startMs`: only an instant can have an instant subtracted from it.
  if (isInstant(operands.right) && node.operator === '-') {
    return 'DateTime.distance' satisfies DateTimeApi;
  }

  if (isLiteral(node.right, 1000) && node.operator === '/') {
    return instant ? ('DateTime.toEpochSeconds' satisfies DateTimeApi) : ('Duration.toSeconds' satisfies DurationApi);
  }

  const zero = !instant && (isLiteral(node.left, 0) || isLiteral(node.right, 0));

  return R.get(zeroSuggestions, node.operator).pipe(
    Opt.filter(() => zero),
    Opt.orElse(() => Opt.filter(R.get(instantSuggestions, node.operator), () => instant)),
    Opt.orElse(() => R.get(durationSuggestions, node.operator)),
    Opt.getOrElse(() => 'Duration'),
  );
}

function isBinary(node: ESTree.Node): node is ESTree.BinaryExpression {
  return node.type === 'BinaryExpression' && node.left.type !== 'PrivateIdentifier';
}

function enclosingBinary(node: ESTree.Node): Opt.Option<ESTree.BinaryExpression> {
  return Opt.flatMap(parentOf(node), (parent) =>
    isWrapperExpressionType(parent.type) ? enclosingBinary(parent) : Opt.filter(Opt.some(parent), isBinary),
  );
}

export const noMillisArithmetic: CreateRule = Rule.define({
  name: 'no-millis-arithmetic',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Disallow arithmetic and comparisons on millisecond numbers where Effect Duration or DateTime can do the math.',
    messages: {
      millisArithmetic:
        '{{operand}} is {{what}} in milliseconds. Keep it as a {{module}} and use {{suggestion}}; convert to milliseconds only where a non-Effect API needs them.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Duration',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function importedKind(node: ESTree.Node, kind: MillisKind) {
      return Effect.map(isImportedApi(node), (imported) => (imported ? Opt.some(kind) : Opt.none<MillisKind>()));
    }

    function apiKind(node: ESTree.Node): Effect.Effect<Opt.Option<MillisKind>, never, RuleContext> {
      if (imports.isApiPath(node, ['Duration', 'toMillis' satisfies keyof typeof Duration])) {
        return importedKind(node, 'duration');
      }

      return imports.isApiPath(node, ['DateTime', 'toEpochMillis' satisfies keyof typeof DateTime])
        ? importedKind(node, 'instant')
        : Effect.succeedNone;
    }

    const identifierKind = Effect.fnUntraced(function* (node: ESTree.IdentifierReference, depth: number) {
      const variable = yield* resolveVariable(node, node.name);

      const definition = soleDefinition(variable);

      if (Opt.exists(definition, (binding) => isForeignBinding(binding, imports))) {
        return Opt.none<MillisKind>();
      }

      const named = millisName(node.name);

      if (Opt.isSome(named)) {
        return named;
      }

      const traced = Opt.flatMap(definition, ({ node: declarator, name }) =>
        declarator.type === 'VariableDeclarator' &&
        isConstDeclaration(declarator.parent) &&
        declarator.id === name &&
        P.isNotNull(declarator.init)
          ? Opt.some(declarator.init)
          : Opt.none(),
      );

      return Opt.isSome(traced) ? yield* millisKind(traced.value, depth + 1) : Opt.none<MillisKind>();
    });

    function millisKind(
      node: ESTree.Expression,
      depth: number,
    ): Effect.Effect<Opt.Option<MillisKind>, never, RuleContext> {
      if (depth > maxTraceDepth) {
        return Effect.succeedNone;
      }

      const expression = unwrapExpression(node);

      if (expression.type === 'Identifier') {
        return identifierKind(expression, depth);
      }

      // A class's own fields are internal; other objects' `*Ms` fields may belong to an external API.
      if (expression.type === 'MemberExpression') {
        return Effect.succeed(
          expression.object.type === 'ThisExpression'
            ? Opt.flatMap(staticPropertyName(expression), millisName)
            : Opt.none(),
        );
      }

      if (expression.type === 'CallExpression') {
        return apiKind(expression.callee);
      }

      // `yield* Clock.currentTimeMillis`
      if (expression.type === 'YieldExpression') {
        const argument = expression.argument;

        return P.isNotNull(argument) &&
          expression.delegate &&
          imports.isApiPath(argument, ['Clock', 'currentTimeMillis'])
          ? importedKind(argument, 'instant')
          : Effect.succeedNone;
      }

      if (!isBinary(expression) || !isArithmeticOperator(expression.operator)) {
        return Effect.succeedNone;
      }

      return Effect.map(
        operandsOf(expression, depth),
        Opt.map((operands) => resultKind(expression.operator, operands)),
      );
    }

    function operandsOf(
      node: ESTree.BinaryExpression,
      depth: number,
    ): Effect.Effect<Opt.Option<Operands>, never, RuleContext> {
      if (
        !R.has(durationSuggestions, node.operator) ||
        // String concatenation such as `'took ' + elapsedMs + 'ms'` only formats the number.
        (node.operator === '+' && (isStringy(node.left) || isStringy(node.right))) ||
        ((node.operator === '===' || node.operator === '!==') &&
          (isNonNumericLiteral(node.left) || isNonNumericLiteral(node.right)))
      ) {
        return Effect.succeedNone;
      }

      return Effect.map(
        Effect.all({ left: millisKind(node.left, depth), right: millisKind(node.right, depth) }),
        (operands): Opt.Option<Operands> =>
          Opt.isNone(operands.left) && Opt.isNone(operands.right) ? Opt.none() : Opt.some(operands),
      );
    }

    function report(node: ESTree.BinaryExpression, operands: Operands) {
      const instant = isInstant(operands.left) || isInstant(operands.right);

      return ctx.report(
        Diagnostic.fromId({
          node,
          messageId: 'millisArithmetic',
          data: {
            operand: ctx.sourceCode.getText(
              Opt.match(operands.left, { onNone: () => node.right, onSome: () => node.left }),
            ),
            what: instant ? 'a timestamp' : 'a duration',
            module: instant ? 'DateTime' : 'Duration',
            suggestion: suggestion(node, operands),
          },
        }),
      );
    }

    return Visitor.on(
      'BinaryExpression',
      Effect.fnUntraced(function* (node) {
        if (!isBinary(node)) {
          return;
        }

        const operands = yield* operandsOf(node, 0);

        if (Opt.isNone(operands)) {
          return;
        }

        // Report a chain such as `toMillis(a) + toMillis(b) > limitMs` once, at its outermost operator.
        const outer = enclosingBinary(node);

        const outerOperands = Opt.isSome(outer) ? yield* operandsOf(outer.value, 0) : Opt.none();

        if (Opt.isSome(outerOperands)) {
          return;
        }

        yield* report(node, operands.value);
      }),
    );
  },
});
