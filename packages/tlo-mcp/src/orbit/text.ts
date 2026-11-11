import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';
import * as SchemaIssue from 'effect/SchemaIssue';
import * as Str from 'effect/String';

/**
 * Orbit sends wall-clock times without a UTC offset; they are local to this zone.
 */
export const TIME_ZONE = 'Europe/Amsterdam';

/**
 * An Orbit tool: the schema of its arguments and the schema that decodes its text result.
 */
export interface OrbitTool<TArgs extends Schema.Top, TResult extends Schema.Top> {
  readonly name: string;
  readonly args: TArgs;
  readonly result: TResult;
}

// The `u` flag lets the pattern reach JSON schemas; Effect only exports patterns in that regex dialect.
export const ApiId = Schema.String.check(Schema.isPattern(/^[A-Z0-9]{15}$/u)).annotate({
  description: 'Orbit api_id',
});

// Orbit starts every api_id with a two-letter type code, so a project passed as a task fails before Orbit is called.
export const ProjectId = Schema.String.check(Schema.isPattern(/^PR[A-Z0-9]{13}$/u)).annotate({
  description: 'Project api_id, starting with PR',
});

export const ProjectTaskId = Schema.String.check(Schema.isPattern(/^PT[A-Z0-9]{13}$/u)).annotate({
  description: 'Project task api_id, starting with PT',
});

export const UserId = Schema.String.check(Schema.isPattern(/^US[A-Z0-9]{13}$/u)).annotate({
  description: 'User api_id, starting with US',
});

/**
 * A field Orbit clears or unlinks with `sentinel` (an empty string, `0` or `NONE`), as `null`.
 *
 * @param sentinel
 */
export function NullAs(sentinel: string) {
  return Schema.String.pipe(
    Schema.decodeTo(Schema.String.pipe(Schema.NullOr), {
      // eslint-disable-next-line unicorn/no-null -- the gateway's value for a cleared field
      decode: SchemaGetter.transform((value) => (value === sentinel ? null : value)),
      encode: SchemaGetter.transform((value) => value ?? sentinel),
    }),
  );
}

// Orbit's comma-separated list, where an empty string clears it.
export const CommaList = Schema.String.pipe(
  Schema.decodeTo(Schema.NonEmptyArray(Schema.String).pipe(Schema.NullOr), {
    // eslint-disable-next-line unicorn/no-null -- the gateway's value for a cleared list
    decode: SchemaGetter.transform((list) => (list === '' ? null : Str.split(list, ','))),
    encode: SchemaGetter.transform((list) => (P.isNull(list) ? '' : Arr.join(list, ','))),
  }),
);

// `DateTime.make` rolls 2026-02-30 over to March, so a date only counts when it formats back to itself.
export const LocalDate = Schema.String.check(
  Schema.makeFilter((date) => DateTime.make(date).pipe(Opt.exists((day) => DateTime.formatIsoDateUtc(day) === date)), {
    expected: 'an existing date as yyyy-MM-dd',
  }),
).annotate({ description: 'Date as yyyy-MM-dd' });

export const Minutes = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/**
 * Orbit durations such as `8h`, `0h15` and `158h51`, as minutes.
 */
export const Duration = Schema.String.check(Schema.isPattern(/^\d+h(?:[0-5]\d)?$/)).pipe(
  Schema.decodeTo(Minutes, {
    decode: SchemaGetter.transform((duration) => {
      const [hours, minutes = ''] = Str.split(duration, 'h');

      return Number(hours) * 60 + Number(minutes);
    }),
    encode: SchemaGetter.transform(
      (minutes) => `${Math.floor(minutes / 60)}h${Str.padStart(2, '0')(String(minutes % 60))}`,
    ),
  }),
);

/**
 * Orbit's offset-less `yyyy-MM-dd HH:mm`, read as Europe/Amsterdam and encoded as ISO 8601 with offset. A time that
 * does not exist there fails instead of rolling over. A time in the autumn hour that occurs twice cannot be told apart
 * and takes the earlier, summer-time offset.
 */
export const Timestamp = Schema.String.pipe(
  Schema.decodeTo(Schema.DateTimeZoned, {
    decode: SchemaGetter.transformEffect((local, options) => {
      const iso = Str.replace(' ', 'T')(local);

      return DateTime.makeZoned(`${iso}:00Z`, { timeZone: TIME_ZONE, adjustForTimeZone: true }).pipe(
        Opt.filter((zoned) => zoned.pipe(DateTime.formatIsoZoned, Str.startsWith(`${iso}:00`))),
        Effect.fromOption,
        Effect.mapError(
          () => new SchemaIssue.InvalidValue({ message: 'Expected an existing yyyy-MM-dd HH:mm' }, local, options),
        ),
      );
    }),
    encode: SchemaGetter.transform(DateTime.formatIsoZoned),
  }),
).annotate({ description: 'ISO 8601 date-time with offset, in Europe/Amsterdam' });

/**
 * One line of Orbit text: the named groups of `pattern`, decoded as `fields`. Groups that did not match are absent
 * keys, so optional values never become `undefined`.
 *
 * @param pattern
 * @param fields
 */
export function Line<const TFields extends Schema.Struct.Fields>(pattern: RegExp, fields: TFields) {
  const struct = Schema.Struct(fields);

  return Schema.String.pipe(
    Schema.decodeTo(struct, {
      decode: SchemaGetter.transformEffect((line, options) => {
        const match = pattern.exec(line);

        return P.isNull(match)
          ? Effect.fail(
              new SchemaIssue.InvalidValue({ message: `Unexpected line: ${JSON.stringify(line)}` }, line, options),
            )
          : Effect.succeed(R.filter(match.groups ?? {}, P.isNotUndefined) as (typeof struct)['Encoded']);
      }),
      encode: SchemaGetter.forbiddenEncoding,
    }),
  );
}

/**
 * Orbit's CRLF-separated lines, each decoded as `line`; blank lines and lines matching `ignore` are skipped. A bare LF
 * stays inside its line, as in multi-line descriptions.
 *
 * @param line
 * @param ignore
 */
export function Lines<TLine extends Schema.Top & { readonly Encoded: string }>(
  line: TLine,
  ...ignore: ReadonlyArray<RegExp>
) {
  return Schema.String.pipe(
    Schema.decodeTo(Schema.Array(line), {
      decode: SchemaGetter.transform((text) =>
        Arr.filter(
          Str.split(text, '\r\n'),
          (row) => Str.isNonEmpty(Str.trim(row)) && !Arr.some(ignore, (pattern) => pattern.test(row)),
        ),
      ),
      encode: SchemaGetter.forbiddenEncoding,
    }),
  );
}
