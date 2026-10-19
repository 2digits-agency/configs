// oxlint-disable unicorn/no-array-method-this-argument
import type { Context, ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Num from 'effect/Number';
import * as Opt from 'effect/Option';

import { importedApi } from '../../fixes';
import { argumentAt, canonicalPath, objectProperty, unwrapExpression, type FileState } from '../../utils';

type DurationPosition = 'first' | 'last' | 'options.duration';

/**
 * Effect v4 APIs that accept `Duration.Input`, keyed by canonical path. Dual APIs take the duration last in both their
 * data-first and data-last forms.
 */
const durationApis = new Map<string, DurationPosition>([
  ['Effect.cachedInvalidateWithTTL', 'last'],
  ['Effect.cachedWithTTL', 'last'],
  ['Effect.delay', 'last'],
  ['Effect.sleep', 'last'],
  ['Effect.timeout', 'last'],
  ['Effect.timeoutOption', 'last'],
  ['Effect.timeoutOrElse', 'options.duration'],
  ['Schedule.duration', 'last'],
  ['Schedule.during', 'last'],
  ['Schedule.exponential', 'first'],
  ['Schedule.fibonacci', 'last'],
  ['Schedule.fixed', 'last'],
  ['Schedule.spaced', 'last'],
  ['Schedule.windowed', 'last'],
  ['Stream.debounce', 'last'],
  ['Stream.groupedWithin', 'last'],
  ['Stream.throttle', 'options.duration'],
  ['Stream.timeout', 'last'],
  ['TestClock.adjust', 'last'],
]);

/**
 * Return the expression a call passes as its `Duration.Input`, if the callee is a known Effect duration API that still
 * resolves to its runtime import.
 *
 * @param node Call to inspect.
 * @param context Rule context, used to reject shadowed import names.
 * @param state Effect import bindings for the file.
 */
export function durationArgument(
  node: ESTree.CallExpression,
  context: Context,
  state: FileState,
): ESTree.Expression | undefined {
  const path = canonicalPath(node.callee, state);

  const api = path === undefined ? undefined : durationApis.get(Arr.join(path, '.'));

  const position = api !== undefined && importedApi(context, node.callee) ? api : undefined;

  if (position === 'first') {
    return argumentAt(node, 0);
  }

  if (position === 'last') {
    return argumentAt(node, node.arguments.length - 1);
  }

  if (position === 'options.duration') {
    const options = argumentAt(node, node.arguments.length - 1);

    const property = options?.type === 'ObjectExpression' ? objectProperty(options, 'duration') : undefined;

    return property?.value;
  }

  return undefined;
}

/**
 * Evaluate number literals and arithmetic on number literals, such as `-1` or `24 * 60 * 60 * 1000`.
 *
 * @param node Expression to evaluate.
 */
export function numericValue(node: ESTree.Expression): number | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return typeof expression.value === 'number' ? expression.value : undefined;
  }

  if (expression.type === 'UnaryExpression' && (expression.operator === '-' || expression.operator === '+')) {
    const argument = numericValue(expression.argument);

    return argument === undefined || expression.operator === '+' ? argument : -argument;
  }

  if (expression.type !== 'BinaryExpression' || expression.left.type === 'PrivateIdentifier') {
    return undefined;
  }

  const left = numericValue(expression.left);

  const right = numericValue(expression.right);

  if (left === undefined || right === undefined) {
    return undefined;
  }

  return Match.value(expression.operator).pipe(
    Match.when('*', () => Num.multiply(left, right)),
    Match.when('+', () => Num.sum(left, right)),
    Match.when('-', () => Num.subtract(left, right)),
    Match.when('/', () => Num.divideUnsafe(left, right)),
    Match.when('%', () => Num.remainder(left, right)),
    Match.when('**', () => left ** right),
    Match.orElse(Fn.constUndefined),
  );
}

function factors(node: ESTree.Expression): Array<number> | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return typeof expression.value === 'number' ? [expression.value] : undefined;
  }

  if (expression.type !== 'BinaryExpression' || expression.operator !== '*') {
    return undefined;
  }

  const left = factors(expression.left);

  const right = factors(expression.right);

  return left === undefined || right === undefined ? undefined : [...left, ...right];
}

// Minute, hour, and day sizes in milliseconds are unambiguous on their own.
const millisFactors = new Set([60_000, 3_600_000, 86_400_000]);

const sixtyFactors = new Set([60, 3600, 86_400]);

const timeFactors = new Set([7, 24, 60, 1000, 3600, 86_400]);

/**
 * Detect hand-written time arithmetic such as `5 * 60 * 1000`, `24 * 60 * 60`, or `5 * 60_000`. A lone `60` is not
 * enough: `60 * 1024` and `60 * 2` are not times.
 *
 * @param node Expression to inspect.
 */
export function timeArithmetic(node: ESTree.Expression): { readonly millis: boolean } | undefined {
  const product = factors(node);

  if (product === undefined || product.length < 2) {
    return undefined;
  }

  const time =
    Arr.some(product, (factor) => millisFactors.has(factor)) ||
    (Arr.some(product, (factor) => sixtyFactors.has(factor)) &&
      Arr.filter(product, (factor) => timeFactors.has(factor)).length >= 2);

  if (!time) {
    return undefined;
  }

  return {
    millis: product.includes(1000) || Arr.some(product, (factor) => factor % 60_000 === 0),
  };
}

export type DurationUnit = 'days' | 'hours' | 'millis' | 'minutes' | 'seconds' | 'weeks';

const unitMillis: ReadonlyArray<readonly [DurationUnit, number]> = [
  ['weeks', 604_800_000],
  ['days', 86_400_000],
  ['hours', 3_600_000],
  ['minutes', 60_000],
  ['seconds', 1000],
  ['millis', 1],
];

function formatNumber(value: number): string {
  if (!Number.isSafeInteger(value) || Math.abs(value) < 10_000) {
    return String(value);
  }

  return String(value).replaceAll(/\B(?=(?:\d{3})+$)/gu, '_');
}

/**
 * Pick the most readable Duration constructor for an amount in a given unit.
 *
 * @param value Amount in `unit`.
 * @param unit Unit of `value`.
 */
export function durationConstructor(value: number, unit: DurationUnit): string {
  const millis = value * (Arr.findFirst(unitMillis, ([name]) => name === unit).pipe(Opt.getOrUndefined)?.[1] ?? 1);

  if (millis === 0) {
    return 'Duration.zero';
  }

  for (const [name, size] of unitMillis) {
    if (Number.isSafeInteger(millis / size)) {
      return `Duration.${name}(${formatNumber(millis / size)})`;
    }
  }

  return `Duration.millis(${formatNumber(millis)})`;
}
