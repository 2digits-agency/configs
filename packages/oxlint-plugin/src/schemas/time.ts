import * as Schema from 'effect/Schema';

import type { DurationUnit } from '../rules/effect/internal/duration';

export const SingularUnit = Schema.Literals(['day', 'hour', 'minute', 'second', 'week']);

export const DurationUnitName = Schema.Literals([
  'days',
  'hours',
  'millis',
  'minutes',
  'seconds',
  'weeks',
] satisfies ReadonlyArray<DurationUnit>);

export const ZeroDurationInput = Schema.String.check(
  Schema.isPattern(/^0\s*(?:nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/i),
);

// Singular units name a quantity (`ONE_DAY`), not the unit of the number, so they only mark the name as a duration.
export const DurationWord = Schema.Literals([
  ...SingularUnit.literals,
  'backoff',
  'cooldown',
  'debounce',
  'delay',
  'duration',
  'expiration',
  'expiry',
  'interval',
  'lifetime',
  'throttle',
  'timeout',
  'ttl',
]);

export const InstantWord = Schema.Literals([
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

// Conversion factors (`MS_PER_SECOND`, `SECONDS_IN_MINUTE`), rates (`REQUESTS_PER_SECOND`), and timestamps
// (`CREATED_AT_MS`) are not durations.
export const NonDurationWord = Schema.Literals([...InstantWord.pick(['at', 'epoch', 'timestamp']).literals, 'per']);

export const MillisWord = Schema.Literals(['millis', 'milliseconds', 'ms']);

/**
 * What a millisecond number stands for: a point in time (epoch millis) or an amount of time.
 */
export const MillisKind = Schema.Literals(['duration', 'instant']);

export type MillisKind = typeof MillisKind.Type;

// Minute, hour, and day sizes in milliseconds are unambiguous on their own.
export const MillisFactor = Schema.Literals([60_000, 3_600_000, 86_400_000]);

export const SixtyFactor = Schema.Literals([60, 3600, 86_400]);

export const TimeFactor = Schema.Literals([7, 24, 1000, ...SixtyFactor.literals]);

export const NativeDateFormattingMethod = Schema.Literals([
  'toISOString',
  'toLocaleDateString',
  'toLocaleTimeString',
] satisfies ReadonlyArray<keyof Date>);
