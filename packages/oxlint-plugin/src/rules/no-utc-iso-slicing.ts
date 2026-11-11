import type * as EffectBarrel from 'effect';
import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import type * as Fn from 'effect/Function';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import type * as Str from 'effect/String';

import { argumentAt, staticPropertyName, unwrapExpression } from '../internal/ast';
import { importBindings, type ImportBindings } from '../internal/imports';
import { ruleMeta } from '../internal/meta';
import { defineRule } from '../internal/rule';

const isStringMethod = Schema.is(Schema.Literals(['replace', 'replaceAll', 'slice', 'split', 'substr', 'substring']));

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
function isUtcIsoFormatter(node: ESTree.Expression, imports: ImportBindings): boolean {
  return imports.isApi(unwrap(node), 'DateTime', formatIso);
}

// `x.toISOString()` or `DateTime.formatIso(x)`: a UTC timestamp such as `2026-03-29T23:30:00.000Z`.
function isUtcIsoString(node: ESTree.Expression, imports: ImportBindings): boolean {
  const expression = unwrap(node);

  if (expression.type !== 'CallExpression') {
    return false;
  }

  const callee = unwrap(expression.callee);

  return (
    (callee.type === 'MemberExpression' &&
      Opt.contains(staticPropertyName(callee), 'toISOString') &&
      Arr.isReadonlyArrayEmpty(expression.arguments)) ||
    isUtcIsoFormatter(callee, imports)
  );
}

// A data-last `effect/String` step, such as `Str.slice(0, 10)`.
function isStringStep(node: ESTree.Expression, imports: ImportBindings): boolean {
  const step = unwrap(node);

  return step.type === 'CallExpression' && imports.isApi(step.callee, 'String', stringSteps);
}

function isPipeFunction(node: ESTree.Expression, imports: ImportBindings): boolean {
  return (
    imports.isApi(node, 'Function', pipeFunctions) ||
    imports.isApiPath(node, ['pipe' satisfies keyof typeof EffectBarrel]) ||
    imports.isApiPath(node, ['flow' satisfies keyof typeof EffectBarrel])
  );
}

// The values and steps of `self.pipe(...)`, `pipe(...)` or `flow(...)`, in order.
function pipeSequence(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): Opt.Option<ReadonlyArray<ESTree.Expression>> {
  const callee = unwrap(node.callee);

  const steps = Arr.filter(
    node.arguments,
    (argument): argument is ESTree.Expression => argument.type !== 'SpreadElement',
  );

  if (steps.length !== node.arguments.length) {
    return Opt.none();
  }

  if (
    callee.type === 'MemberExpression' &&
    callee.object.type !== 'Super' &&
    Opt.contains(staticPropertyName(callee), 'pipe')
  ) {
    return Opt.some([callee.object, ...steps]);
  }

  return isPipeFunction(callee, imports) ? Opt.some(steps) : Opt.none();
}

/**
 * Whether a call slices or rewrites a UTC ISO string directly: `x.toISOString().slice(0, 10)`,
 * `Str.split(DateTime.formatIso(x), 'T')` or `Str.slice(0, 10)(DateTime.formatIso(x))`.
 *
 * @param node Call to inspect.
 * @param imports Import bindings of the file.
 */
function slicesDirectly(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  const callee = unwrap(node.callee);

  const firstIsUtcIso = Opt.exists(argumentAt(node, 0), (argument) => isUtcIsoString(argument, imports));

  return (
    (callee.type === 'MemberExpression' &&
      Opt.exists(staticPropertyName(callee), isStringMethod) &&
      isUtcIsoString(callee.object, imports)) ||
    (node.arguments.length === 2 && imports.isApi(callee, 'String', dataFirstStringSteps) && firstIsUtcIso) ||
    (node.arguments.length === 1 && isStringStep(callee, imports) && firstIsUtcIso)
  );
}

/**
 * The node to report when `node` slices or rewrites a UTC ISO string. In a pipe, such as `pipe(DateTime.formatIso(x),
 * Str.slice(0, 10))` or `x.pipe(DateTime.formatIso, Str.slice(0, 10))`, that is the string step.
 *
 * @param node Call to inspect.
 * @param imports Import bindings of the file.
 */
function slicedUtcIso(node: ESTree.CallExpression, imports: ImportBindings): Opt.Option<ESTree.Node> {
  if (slicesDirectly(node, imports)) {
    return Opt.some(node);
  }

  return pipeSequence(node, imports).pipe(
    Opt.flatMap((sequence) =>
      Arr.findFirst(
        Arr.zip(sequence, Arr.drop(sequence, 1)),
        ([previous, step]) =>
          isStringStep(step, imports) && (isUtcIsoString(previous, imports) || isUtcIsoFormatter(previous, imports)),
      ),
    ),
    Opt.map(([, step]) => step),
  );
}

export const noUtcIsoSlicing: CreateRule = defineRule({
  name: 'no-utc-iso-slicing',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow slicing or rewriting a UTC ISO string to get a local date or time.',
    messages: {
      utcIsoSlicing:
        'toISOString() and DateTime.formatIso give UTC, so slicing or rewriting them gives the UTC date and time: in Europe/Amsterdam the previous day between 00:00 and 02:00, and +00:00 instead of +01:00/+02:00. Format in an explicit zone instead: DateTime.setZone with DateTime.formatIsoDate, formatIsoOffset or formatIsoZoned, or Intl.DateTimeFormat with timeZone.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/DateTime',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      Opt.match(slicedUtcIso(node, imports), {
        onNone: () => Effect.void,
        onSome: (reported) => ctx.report(Diagnostic.fromId({ node: reported, messageId: 'utcIsoSlicing' })),
      }),
    );
  },
});
