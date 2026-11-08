import type { Definition, ESTree, Rule } from '@oxlint/plugins';
import type * as DateTime from 'effect/DateTime';
import type * as Duration from 'effect/Duration';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';

import { importedApi } from '../../fixes';
import {
  canonicalPath,
  defineEffectRule,
  enclosingFunction,
  isApiPath,
  isConstDeclaration,
  isLiteral,
  resolveVariable,
  ruleMeta,
  soleDefinition,
  staticPropertyName,
  unwrapExpression,
  wrapperExpressionTypes,
  type FileState,
} from '../../utils';
import { millisName, type MillisKind } from './duration';
import { isForeignCallback } from './utils';

type DateTimeApi = `DateTime.${keyof typeof DateTime}`;

type DurationApi = `Duration.${keyof typeof Duration}`;

const arithmeticOperators: ReadonlySet<string> = new Set(['*', '+', '-', '/']);

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

const reportedOperators: ReadonlySet<string> = new Set(R.keys(durationSuggestions));

// Tracing stops after a few `const` hops; longer chains are not worth the lookups.
const maxTraceDepth = 4;

interface Operands {
  readonly left: MillisKind | undefined;
  readonly right: MillisKind | undefined;
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
 * @param state Effect import bindings for the file.
 */
function isForeignBinding(definition: Definition, state: FileState): boolean {
  const parent = definition.name.parent;

  const binding = parent.type === 'AssignmentPattern' ? parent.parent : parent;

  if (binding.type === 'Property') {
    return true;
  }

  if (definition.type !== 'Parameter') {
    return false;
  }

  const owner = enclosingFunction(definition.name);

  return P.isNotUndefined(owner) && isForeignCallback(owner, state);
}

/**
 * The kind of a `+`, `-`, `*` or `/` result: two instants subtract to a duration, an instant plus a duration or an
 * instant minus a duration stays an instant, and everything else is a duration.
 *
 * @param operator Arithmetic operator.
 * @param operands Kinds of both operands.
 */
function resultKind(operator: string, operands: Operands): MillisKind {
  const left = operands.left === 'instant';

  const right = operands.right === 'instant';

  if (operator === '+') {
    return left === right ? 'duration' : 'instant';
  }

  return left && !right && operator === '-' ? 'instant' : 'duration';
}

function suggestion(node: ESTree.BinaryExpression, operands: Operands): string {
  const instant = operands.left === 'instant' || operands.right === 'instant';

  // `nowMs - startMs` and `Date.now() - startMs`: only an instant can have an instant subtracted from it.
  if (operands.right === 'instant' && node.operator === '-') {
    return 'DateTime.distance' satisfies DateTimeApi;
  }

  if (isLiteral(node.right, 1000) && node.operator === '/') {
    return instant ? ('DateTime.toEpochSeconds' satisfies DateTimeApi) : ('Duration.toSeconds' satisfies DurationApi);
  }

  const zero = !instant && (isLiteral(node.left, 0) || isLiteral(node.right, 0));

  return (
    (zero ? zeroSuggestions[node.operator] : undefined) ??
    (instant ? instantSuggestions[node.operator] : undefined) ??
    durationSuggestions[node.operator] ??
    'Duration'
  );
}

function isBinary(node: ESTree.Node | null | undefined): node is ESTree.BinaryExpression {
  return node?.type === 'BinaryExpression' && node.left.type !== 'PrivateIdentifier';
}

function enclosingBinary(node: ESTree.Node): ESTree.BinaryExpression | undefined {
  let parent = node.parent;

  while (parent && wrapperExpressionTypes.has(parent.type)) {
    parent = parent.parent;
  }

  return isBinary(parent) ? parent : undefined;
}

export const noMillisArithmetic: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Disallow arithmetic and comparisons on millisecond numbers where Effect Duration or DateTime can do the math.',
    {
      millisArithmetic:
        '{{operand}} is {{what}} in milliseconds. Keep it as a {{module}} and use {{suggestion}}; convert to milliseconds only where a non-Effect API needs them.',
    },
    'https://www.effect.website/docs/v4/api/effect/Duration',
  ),
  (context, getState) => {
    function apiKind(node: ESTree.Node): MillisKind | undefined {
      const path = canonicalPath(node, getState());

      if (path?.length !== 2 || !importedApi(context, node)) {
        return undefined;
      }

      const api = `${path[0]}.${path[1]}`;

      if (api === ('Duration.toMillis' satisfies DurationApi)) {
        return 'duration';
      }

      return api === ('DateTime.toEpochMillis' satisfies DateTimeApi) ? 'instant' : undefined;
    }

    function identifierKind(node: ESTree.IdentifierReference, depth: number): MillisKind | undefined {
      const definition = soleDefinition(resolveVariable(context, node, node.name));

      if (P.isNotUndefined(definition) && isForeignBinding(definition, getState())) {
        return undefined;
      }

      const named = millisName(node.name);

      if (P.isNotUndefined(named)) {
        return named;
      }

      const declarator = definition?.node;

      return declarator?.type === 'VariableDeclarator' &&
        isConstDeclaration(declarator.parent) &&
        declarator.id === definition?.name &&
        P.isNotNull(declarator.init)
        ? millisKind(declarator.init, depth + 1)
        : undefined;
    }

    function millisKind(node: ESTree.Expression, depth = 0): MillisKind | undefined {
      if (depth > maxTraceDepth) {
        return undefined;
      }

      const expression = unwrapExpression(node);

      if (expression.type === 'Identifier') {
        return identifierKind(expression, depth);
      }

      // A class's own fields are internal; other objects' `*Ms` fields may belong to an external API.
      if (expression.type === 'MemberExpression') {
        const name = expression.object.type === 'ThisExpression' ? staticPropertyName(expression) : undefined;

        return P.isUndefined(name) ? undefined : millisName(name);
      }

      if (expression.type === 'CallExpression') {
        return apiKind(expression.callee);
      }

      // `yield* Clock.currentTimeMillis`
      if (expression.type === 'YieldExpression') {
        const argument = expression.argument;

        return P.isNotNull(argument) &&
          expression.delegate &&
          isApiPath(argument, getState(), ['Clock', 'currentTimeMillis']) &&
          importedApi(context, argument)
          ? 'instant'
          : undefined;
      }

      if (!isBinary(expression) || !arithmeticOperators.has(expression.operator)) {
        return undefined;
      }

      const operands = operandsOf(expression, depth);

      return P.isUndefined(operands) ? undefined : resultKind(expression.operator, operands);
    }

    function operandsOf(node: ESTree.BinaryExpression, depth: number): Operands | undefined {
      if (!reportedOperators.has(node.operator)) {
        return undefined;
      }

      // String concatenation such as `'took ' + elapsedMs + 'ms'` only formats the number.
      if (node.operator === '+' && (isStringy(node.left) || isStringy(node.right))) {
        return undefined;
      }

      if (
        (node.operator === '===' || node.operator === '!==') &&
        (isNonNumericLiteral(node.left) || isNonNumericLiteral(node.right))
      ) {
        return undefined;
      }

      const left = millisKind(node.left, depth);

      const right = millisKind(node.right, depth);

      return P.isUndefined(left) && P.isUndefined(right) ? undefined : { left, right };
    }

    return {
      BinaryExpression(node) {
        if (!getState().hasEffectImport) {
          return;
        }

        const operands = operandsOf(node, 0);

        const outer = enclosingBinary(node);

        // Report a chain such as `toMillis(a) + toMillis(b) > limitMs` once, at its outermost operator.
        if (P.isUndefined(operands) || (P.isNotUndefined(outer) && P.isNotUndefined(operandsOf(outer, 0)))) {
          return;
        }

        const instant = operands.left === 'instant' || operands.right === 'instant';

        context.report({
          node,
          messageId: 'millisArithmetic',
          data: {
            operand: context.sourceCode.getText(P.isUndefined(operands.left) ? node.right : node.left),
            what: instant ? 'a timestamp' : 'a duration',
            module: instant ? 'DateTime' : 'Duration',
            suggestion: suggestion(node, operands),
          },
        });
      },
    };
  },
);
