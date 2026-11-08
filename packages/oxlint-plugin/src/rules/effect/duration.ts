// oxlint-disable unicorn/no-array-method-this-argument
import type { Context, ESTree } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Duration from 'effect/Duration';
import type * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Num from 'effect/Number';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import type * as Schedule from 'effect/Schedule';
import type * as Stream from 'effect/Stream';
import * as Str from 'effect/String';
import type * as TestClock from 'effect/testing/TestClock';

import { importedApi } from '../../fixes';
import { argumentAt, canonicalPath, objectProperty, unwrapExpression, type FileState } from '../../utils';

type DurationPosition = 'first' | 'last' | 'options.duration';

type DurationApi =
  | `Effect.${keyof typeof Effect}`
  | `Schedule.${keyof typeof Schedule}`
  | `Stream.${keyof typeof Stream}`
  | `TestClock.${keyof typeof TestClock}`;

/**
 * Effect v4 APIs that accept `Duration.Input`, keyed by canonical path. Dual APIs take the duration last in both their
 * data-first and data-last forms.
 */
const durationApis: ReadonlyMap<string, DurationPosition> = new Map<DurationApi, DurationPosition>([
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

const durationExpressions: Record<DurationPosition, (node: ESTree.CallExpression) => ESTree.Expression | undefined> = {
  first: (node) => argumentAt(node, 0),
  last: (node) => argumentAt(node, node.arguments.length - 1),
  'options.duration': (node) => {
    const options = argumentAt(node, node.arguments.length - 1);

    return options?.type === 'ObjectExpression' ? objectProperty(options, 'duration')?.value : undefined;
  },
};

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

  const position = path === undefined ? undefined : durationApis.get(Arr.join(path, '.'));

  return position !== undefined && importedApi(context, node.callee) ? durationExpressions[position](node) : undefined;
}

type Arithmetic = (left: number, right: number) => number;

function power(base: number, exponent: number): number {
  return base ** exponent;
}

const arithmetic = Match.type<ESTree.BinaryExpression['operator']>().pipe(
  Match.withReturnType<Arithmetic | undefined>(),
  Match.when('*', () => Num.multiply),
  Match.when('+', () => Num.sum),
  Match.when('-', () => Num.subtract),
  Match.when('/', () => Num.divideUnsafe),
  Match.when('%', () => Num.remainder),
  Match.when('**', () => power),
  Match.orElse(Fn.constUndefined),
);

/**
 * Evaluate number literals and arithmetic on number literals, such as `-1` or `24 * 60 * 60 * 1000`.
 *
 * @param node Expression to evaluate.
 */
export function numericValue(node: ESTree.Expression): number | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return P.isNumber(expression.value) ? expression.value : undefined;
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

  return arithmetic(expression.operator)?.(left, right);
}

function factors(node: ESTree.Expression): Array<number> | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return P.isNumber(expression.value) ? [expression.value] : undefined;
  }

  if (expression.type !== 'BinaryExpression' || expression.operator !== '*') {
    return undefined;
  }

  const left = factors(expression.left);

  const right = factors(expression.right);

  return left === undefined || right === undefined ? undefined : Arr.appendAll(left, right);
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
    millis: Arr.contains(product, 1000) || Arr.some(product, (factor) => factor % 60_000 === 0),
  };
}

/**
 * Split a binding name into lowercase words: `requestTimeoutMs`, `REQUEST_TIMEOUT_MS` and `request$timeout$ms` all
 * become `['request', 'timeout', 'ms']`.
 */
export const nameWords: (name: string) => Array<string> = Fn.flow(
  Str.split(/[_$]+|(?<=[\da-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/u),
  Arr.filter(Str.isNonEmpty),
  Arr.map(Str.toLowerCase),
);

/**
 * What a millisecond number stands for: a point in time (epoch millis) or an amount of time.
 */
export type MillisKind = 'duration' | 'instant';

const millisWords = new Set(['millis', 'milliseconds', 'ms']);

const instantWords = new Set([
  'at',
  'created',
  'deadline',
  'end',
  'ended',
  'epoch',
  'last',
  'now',
  'since',
  'start',
  'started',
  'timestamp',
  'until',
  'updated',
]);

/**
 * Classify a binding name that ends in a millisecond unit (`timeoutMs`, `TTL_MILLIS`, `expiresAtMs`). Names that
 * mention a point in time (`at`, `now`, `start`, `deadline`, `epoch`, ...) are instants; other names are durations.
 * Only the last word decides the unit, so `MS_PER_SECOND` and `items` are not milliseconds.
 *
 * @param name Binding or property name.
 */
export function millisName(name: string): MillisKind | undefined {
  const parts = nameWords(name);

  if (!millisWords.has(parts.at(-1) ?? '')) {
    return undefined;
  }

  return Arr.some(parts, (part) => instantWords.has(part)) ? 'instant' : 'duration';
}

export type DurationUnit = Extract<
  keyof typeof Duration,
  'days' | 'hours' | 'millis' | 'minutes' | 'seconds' | 'weeks'
>;

const constructors: Readonly<Record<DurationUnit, (amount: number) => Duration.Duration>> = {
  weeks: Duration.weeks,
  days: Duration.days,
  hours: Duration.hours,
  minutes: Duration.minutes,
  seconds: Duration.seconds,
  millis: Duration.millis,
};

// Largest unit first, so the suggestion picks the biggest unit that holds a whole number.
const unitConversions: ReadonlyArray<readonly [DurationUnit, (self: Duration.Duration) => number]> = [
  ['weeks', Duration.toWeeks],
  ['days', Duration.toDays],
  ['hours', Duration.toHours],
  ['minutes', Duration.toMinutes],
  ['seconds', Duration.toSeconds],
  ['millis', Duration.toMillis],
];

function formatNumber(value: number): string {
  if (!Number.isSafeInteger(value) || Math.abs(value) < 10_000) {
    return String(value);
  }

  return Str.replaceAll(/\B(?=(?:\d{3})+$)/gu, '_')(String(value));
}

/**
 * Pick the most readable Duration constructor for an amount in a given unit.
 *
 * @param value Amount in `unit`.
 * @param unit Unit of `value`.
 */
export function durationConstructor(value: number, unit: DurationUnit): string {
  const duration = constructors[unit](value);

  if (Duration.isZero(duration)) {
    return `Duration.${'zero' satisfies keyof typeof Duration}`;
  }

  return Arr.findFirst(unitConversions, ([, convert]) => Number.isSafeInteger(convert(duration))).pipe(
    Opt.match({
      onNone: () =>
        `Duration.${'millis' satisfies keyof typeof Duration}(${duration.pipe(Duration.toMillis, formatNumber)})`,
      onSome: ([name, convert]) => `Duration.${name}(${formatNumber(convert(duration))})`,
    }),
  );
}
