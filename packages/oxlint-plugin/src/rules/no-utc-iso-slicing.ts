import type { ESTree, Rule } from '@oxlint/plugins';
import type * as EffectBarrel from 'effect';
import * as Arr from 'effect/Array';
import type * as DateTime from 'effect/DateTime';
import * as Fn from 'effect/Function';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import type * as Str from 'effect/String';

import {
  argumentAt,
  defineEffectRule,
  isAnyApi,
  isApi,
  isApiPath,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
} from '../utils';

const stringMethods: ReadonlySet<string> = new Set(['replace', 'replaceAll', 'slice', 'split', 'substr', 'substring']);

const stringSteps = [
  'replace',
  'replaceAll',
  'slice',
  'split',
  'substring',
  'takeLeft',
  'takeRight',
] as const satisfies ReadonlyArray<keyof typeof Str>;

// `Str.split(self, separator)`, `Str.takeLeft(self, n)` and `Str.takeRight(self, n)` are dual.
const dataFirstStringSteps = ['split', 'takeLeft', 'takeRight'] as const satisfies ReadonlyArray<keyof typeof Str>;

const pipeFunctions = ['flow', 'pipe'] as const satisfies ReadonlyArray<keyof typeof Fn>;

const formatIso = 'formatIso' satisfies keyof typeof DateTime;

function unwrap(node: ESTree.Expression): ESTree.Expression {
  const expression = unwrapExpression(node);

  return expression.type === 'ChainExpression' ? expression.expression : expression;
}

// `DateTime.formatIso`, as a pipe step.
function isUtcIsoFormatter(node: ESTree.Expression, state: FileState): boolean {
  return isApi(unwrap(node), state, 'DateTime', formatIso);
}

// `x.toISOString()` or `DateTime.formatIso(x)`: a UTC timestamp such as `2026-03-29T23:30:00.000Z`.
function isUtcIsoString(node: ESTree.Expression | undefined, state: FileState): boolean {
  if (P.isUndefined(node)) {
    return false;
  }

  const expression = unwrap(node);

  if (expression.type !== 'CallExpression') {
    return false;
  }

  const callee = unwrap(expression.callee);

  return (
    (callee.type === 'MemberExpression' &&
      staticPropertyName(callee) === 'toISOString' &&
      !Arr.isReadonlyArrayNonEmpty(expression.arguments)) ||
    isUtcIsoFormatter(callee, state)
  );
}

// A data-last `effect/String` step, such as `Str.slice(0, 10)`.
function isStringStep(node: ESTree.Expression | undefined, state: FileState): boolean {
  if (P.isUndefined(node)) {
    return false;
  }

  const step = unwrap(node);

  return step.type === 'CallExpression' && isAnyApi(step.callee, state, 'String', stringSteps);
}

function isPipeFunction(node: ESTree.Expression, state: FileState): boolean {
  return (
    isAnyApi(node, state, 'Function', pipeFunctions) ||
    isApiPath(node, state, ['pipe' satisfies keyof typeof EffectBarrel]) ||
    isApiPath(node, state, ['flow' satisfies keyof typeof EffectBarrel])
  );
}

// The values and steps of `self.pipe(...)`, `pipe(...)` or `flow(...)`, in order.
function pipeSequence(node: ESTree.CallExpression, state: FileState): ReadonlyArray<ESTree.Expression> | undefined {
  const callee = unwrap(node.callee);

  const steps = Arr.filter(
    node.arguments,
    (argument): argument is ESTree.Expression => argument.type !== 'SpreadElement',
  );

  if (steps.length !== node.arguments.length) {
    return undefined;
  }

  if (callee.type === 'MemberExpression' && callee.object.type !== 'Super' && staticPropertyName(callee) === 'pipe') {
    return [callee.object, ...steps];
  }

  return isPipeFunction(callee, state) ? steps : undefined;
}

// The node to report when `node` slices or rewrites a UTC ISO string.
function slicedUtcIso(node: ESTree.CallExpression, state: FileState): ESTree.Node | undefined {
  const callee = unwrap(node.callee);

  // `x.toISOString().slice(0, 10)`
  if (
    callee.type === 'MemberExpression' &&
    stringMethods.has(staticPropertyName(callee) ?? '') &&
    isUtcIsoString(callee.object, state)
  ) {
    return node;
  }

  // `Str.split(DateTime.formatIso(x), 'T')` and `Str.slice(0, 10)(DateTime.formatIso(x))`
  if (
    (node.arguments.length === 2 &&
      isAnyApi(callee, state, 'String', dataFirstStringSteps) &&
      isUtcIsoString(argumentAt(node, 0), state)) ||
    (node.arguments.length === 1 && isStringStep(callee, state) && isUtcIsoString(argumentAt(node, 0), state))
  ) {
    return node;
  }

  // `pipe(DateTime.formatIso(x), Str.slice(0, 10))`, `x.pipe(DateTime.formatIso, Str.slice(0, 10))` and similar
  const sequence = pipeSequence(node, state);

  if (P.isUndefined(sequence)) {
    return undefined;
  }

  return Fn.pipe(
    Arr.zip(sequence, Arr.drop(sequence, 1)),
    Arr.findFirst(
      ([previous, step]) =>
        isStringStep(step, state) && (isUtcIsoString(previous, state) || isUtcIsoFormatter(previous, state)),
    ),
    Opt.map(([, step]) => step),
    Opt.getOrUndefined,
  );
}

export const noUtcIsoSlicing: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow slicing or rewriting a UTC ISO string to get a local date or time.',
    {
      utcIsoSlicing:
        'toISOString() and DateTime.formatIso give UTC, so slicing or rewriting them gives the UTC date and time: in Europe/Amsterdam the previous day between 00:00 and 02:00, and +00:00 instead of +01:00/+02:00. Format in an explicit zone instead: DateTime.setZone with DateTime.formatIsoDate, formatIsoOffset or formatIsoZoned, or Intl.DateTimeFormat with timeZone.',
    },
    'https://www.effect.website/docs/v4/api/effect/DateTime',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const reported = slicedUtcIso(node, getState());

      if (P.isNotUndefined(reported)) {
        context.report({ node: reported, messageId: 'utcIsoSlicing' });
      }
    },
  }),
);
