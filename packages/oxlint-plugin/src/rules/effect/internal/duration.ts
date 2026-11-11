import type { ESTree, RuleContext } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Fn from 'effect/Function';
import * as Match from 'effect/Match';
import * as Num from 'effect/Number';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import type * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';
import type * as Stream from 'effect/Stream';
import * as Str from 'effect/String';
import type * as TestClock from 'effect/testing/TestClock';

import { argumentAt, objectProperty, unwrapExpression } from '../../../internal/ast';
import type { ImportBindings } from '../../../internal/imports';
import { isImportedApi } from '../../../internal/scope';

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

const durationExpression = Match.type<DurationPosition>().pipe(
  Match.withReturnType<(node: ESTree.CallExpression) => Opt.Option<ESTree.Expression>>(),
  Match.when('first', () => (node) => argumentAt(node, 0)),
  Match.when('last', () => (node) => argumentAt(node, node.arguments.length - 1)),
  Match.when(
    'options.duration',
    () => (node) =>
      argumentAt(node, node.arguments.length - 1).pipe(
        Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
        Opt.flatMap(objectProperty('duration')),
        Opt.map(({ value }) => value),
      ),
  ),
  Match.exhaustive,
);

/**
 * The expression a call passes as its `Duration.Input`, if the callee is a known Effect duration API that still
 * resolves to its runtime import.
 *
 * @param node Call to inspect.
 * @param imports Import bindings of the file.
 */
export function durationArgument(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): Effect.Effect<Opt.Option<ESTree.Expression>, never, RuleContext> {
  return Opt.match(
    imports.path(node.callee).pipe(Opt.flatMapNullishOr((path) => durationApis.get(Arr.join(path, '.')))),
    {
      onNone: () => Effect.succeedNone,
      onSome: (position) =>
        Effect.map(isImportedApi(node.callee), (imported) =>
          imported ? durationExpression(position)(node) : Opt.none<ESTree.Expression>(),
        ),
    },
  );
}

type Arithmetic = (left: number, right: number) => number;

const arithmetic = Match.type<ESTree.BinaryExpression['operator']>().pipe(
  Match.withReturnType<Opt.Option<Arithmetic>>(),
  Match.when('*', () => Opt.some(Num.multiply)),
  Match.when('+', () => Opt.some(Num.sum)),
  Match.when('-', () => Opt.some(Num.subtract)),
  Match.when('/', () => Opt.some(Num.divideUnsafe)),
  Match.when('%', () => Opt.some(Num.remainder)),
  Match.when('**', () => Opt.some((base: number, exponent: number) => base ** exponent)),
  Match.orElse(() => Opt.none()),
);

function numberLiteral(node: ESTree.Expression): Opt.Option<number> {
  return node.type === 'Literal' && P.isNumber(node.value) ? Opt.some(node.value) : Opt.none();
}

/**
 * Evaluate number literals and arithmetic on number literals, such as `-1` or `24 * 60 * 60 * 1000`.
 *
 * @param node Expression to evaluate.
 */
export function numericValue(node: ESTree.Expression): Opt.Option<number> {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return numberLiteral(expression);
  }

  if (expression.type === 'UnaryExpression' && (expression.operator === '-' || expression.operator === '+')) {
    return Opt.map(numericValue(expression.argument), (value) => (expression.operator === '+' ? value : -value));
  }

  if (expression.type !== 'BinaryExpression' || expression.left.type === 'PrivateIdentifier') {
    return Opt.none();
  }

  const { left, right, operator } = expression;

  return Opt.flatMap(arithmetic(operator), (apply) =>
    Opt.zipWith(numericValue(left), numericValue(right), (a, b) => apply(a, b)),
  );
}

function factors(node: ESTree.Expression): Opt.Option<ReadonlyArray<number>> {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return Opt.map(numberLiteral(expression), Arr.of);
  }

  return expression.type === 'BinaryExpression' && expression.operator === '*'
    ? Opt.zipWith(factors(expression.left), factors(expression.right), (left, right) => [...left, ...right])
    : Opt.none();
}

// Minute, hour, and day sizes in milliseconds are unambiguous on their own.
const isMillisFactor = Schema.is(Schema.Literals([60_000, 3_600_000, 86_400_000]));

const isSixtyFactor = Schema.is(Schema.Literals([60, 3600, 86_400]));

const isTimeFactor = Schema.is(Schema.Literals([7, 24, 60, 1000, 3600, 86_400]));

/**
 * Hand-written time arithmetic such as `5 * 60 * 1000`, `24 * 60 * 60`, or `5 * 60_000`, and whether it counts
 * milliseconds. A lone `60` is not enough: `60 * 1024` and `60 * 2` are not times.
 *
 * @param node Expression to inspect.
 */
export function timeArithmetic(node: ESTree.Expression): Opt.Option<{ readonly millis: boolean }> {
  return factors(node).pipe(
    Opt.filter(
      (product) =>
        product.length >= 2 &&
        (Arr.some(product, isMillisFactor) ||
          (Arr.some(product, isSixtyFactor) && Arr.filter(product, isTimeFactor).length >= 2)),
    ),
    Opt.map((product) => ({
      millis: Arr.contains(product, 1000) || Arr.some(product, (factor) => factor % 60_000 === 0),
    })),
  );
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
export const MillisKind = Schema.Literals(['duration', 'instant']);

export type MillisKind = typeof MillisKind.Type;

const isMillisWord = Schema.is(Schema.Literals(['millis', 'milliseconds', 'ms']));

const isInstantWord = Schema.is(
  Schema.Literals([
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
  ]),
);

/**
 * Classify a binding name that ends in a millisecond unit (`timeoutMs`, `TTL_MILLIS`, `expiresAtMs`). Names that
 * mention a point in time (`at`, `now`, `start`, `deadline`, `epoch`, ...) are instants; other names are durations.
 * Only the last word decides the unit, so `MS_PER_SECOND` and `items` are not milliseconds.
 *
 * @param name Binding or property name.
 */
export function millisName(name: string): Opt.Option<MillisKind> {
  const parts = nameWords(name);

  return Arr.last(parts).pipe(
    Opt.filter(isMillisWord),
    Opt.map((): MillisKind => (Arr.some(parts, isInstantWord) ? 'instant' : 'duration')),
  );
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
