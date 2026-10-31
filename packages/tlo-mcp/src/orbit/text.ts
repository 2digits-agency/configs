import * as Arr from 'effect/Array';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Result from 'effect/Result';
import * as Schema from 'effect/Schema';
import * as SchemaIssue from 'effect/SchemaIssue';
import * as SchemaTransformation from 'effect/SchemaTransformation';
import * as Str from 'effect/String';

/**
 * Orbit sends wall-clock times without a UTC offset; they are local to this zone.
 */
export const TIME_ZONE = 'Europe/Amsterdam';

export const ApiId = Schema.String.check(Schema.isPattern(/^[A-Z0-9]{15}$/)).annotate({
  description: 'Orbit api_id',
});

/**
 * Whether a yyyy-MM-dd string names a real day; `Date` would roll 2026-02-30 over to March.
 *
 * @param date
 */
function isCalendarDate(date: string) {
  return DateTime.make(`${date}T00:00:00Z`).pipe(Opt.exists((day) => DateTime.formatIsoDateUtc(day) === date));
}

export const LocalDate = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/),
  Schema.makeFilter(isCalendarDate, { expected: 'an existing calendar date' }),
).annotate({
  description: 'Date as yyyy-MM-dd',
});

export const Minutes = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/;

/**
 * Decodes Orbit's offset-less `yyyy-MM-dd HH:mm` as Europe/Amsterdam (or an ISO date-time with zone) and always encodes
 * ISO 8601 with offset, so tool output carries the offset Orbit leaves out.
 */
export const Timestamp = Schema.String.annotate({
  description: 'ISO 8601 date-time with offset, in Europe/Amsterdam',
}).pipe(
  Schema.decodeTo(
    Schema.DateTimeZoned,
    SchemaTransformation.transformEffect({
      decode: (value, options) => {
        const local = LOCAL_DATE_TIME.exec(value);

        const zoned =
          local === null
            ? DateTime.makeZonedFromString(value)
            : DateTime.makeZoned(`${local[1]}T${local[2]}:00Z`, { timeZone: TIME_ZONE, adjustForTimeZone: true });

        return zoned.pipe(
          Effect.fromOption,
          Effect.mapError(
            () =>
              new SchemaIssue.InvalidValue(
                { message: 'Expected yyyy-MM-dd HH:mm or an ISO date-time' },
                value,
                options,
              ),
          ),
        );
      },
      encode: (zoned) => zoned.pipe(DateTime.formatIsoZoned, Effect.succeed),
    }),
  ),
);

type Groups = Readonly<Record<string, string | undefined>>;

const DURATION = /^(\d+)h(\d{2})?$/;

/**
 * `{ [key]: value }`, or `{}` when the value is undefined. Optional keys stay absent instead of holding undefined,
 * which JSON-RPC responses cannot carry.
 *
 * @param key
 * @param value
 */
export function definedKey<TKey extends string, TValue>(
  key: TKey,
  value: TValue | undefined,
): Partial<Record<TKey, TValue>> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, TValue>);
}

/**
 * Split Orbit's CRLF-delimited text into lines. Values such as descriptions can contain a bare LF, which stays inside
 * its line.
 *
 * @param text
 */
export function linesOf(text: string) {
  return Str.split(text, '\r\n');
}

/**
 * Match one line or fail with the offending line, so a format change names what Orbit sent.
 *
 * @param pattern
 * @param line
 */
export function matchLine(pattern: RegExp, line: string): Result.Result<Groups, string> {
  const match = pattern.exec(line);

  return match === null ? Result.fail(`Unexpected line: ${JSON.stringify(line)}`) : Result.succeed(match.groups ?? {});
}

/**
 * Orbit durations: `8h`, `0h15`, `158h51`.
 *
 * @param duration
 */
export function parseMinutes(duration: string | undefined): Result.Result<number, string> {
  const match = DURATION.exec(duration ?? '');

  return match === null
    ? Result.fail(`Unexpected duration: ${JSON.stringify(duration)}`)
    : Result.succeed(Number(match[1]) * 60 + Number(match[2] ?? 0));
}

/**
 * Read an Orbit wall-clock time as Europe/Amsterdam and encode it as an ISO string with offset.
 *
 * @param date
 * @param time
 */
export function localTimestamp(date: string | undefined, time: string | undefined): Result.Result<string, string> {
  return DateTime.makeZoned(`${date}T${time}:00Z`, { timeZone: TIME_ZONE, adjustForTimeZone: true }).pipe(
    Result.fromOption(() => `Invalid local date-time: ${date} ${time}`),
    Result.map(DateTime.formatIsoZoned),
  );
}

/**
 * Prefix a parse failure with its 1-based line number.
 *
 * @param index
 * @param result
 */
export function atLine<A>(index: number, result: Result.Result<A, string>) {
  return Result.mapError(result, (message) => `line ${index + 1}: ${message}`);
}

/**
 * Split Orbit's `<work> — <description>` entry text.
 *
 * @param text
 */
export function splitWork(text = '') {
  const [work, ...rest] = Str.split(text, ' — ');

  const description = Str.trim(Arr.join(rest, ' — '));

  return { work: Str.trim(work), ...(Str.isEmpty(description) ? {} : { description }) };
}

/**
 * Blank lines and lines matching one of `ignore`.
 *
 * @param line
 * @param ignore
 */
export function isSkipped(line: string, ignore: ReadonlyArray<RegExp>) {
  return Str.isEmpty(Str.trim(line)) || Arr.some(ignore, (pattern) => pattern.test(line));
}

/**
 * Parse a list result line by line. Blank and `ignore`d lines are skipped; every other line must match `item`.
 *
 * @param text
 * @param options
 * @param options.empty
 * @param options.ignore
 * @param options.item
 * @param options.make
 */
export function parseItems<A>(
  text: string,
  options: {
    readonly empty?: RegExp;
    readonly ignore?: ReadonlyArray<RegExp>;
    readonly item: RegExp;
    readonly make: (groups: Groups) => Result.Result<A, string>;
  },
): Result.Result<Array<A>, string> {
  if (options.empty?.test(Str.trim(text)) === true) {
    return Result.succeed([]);
  }

  return Result.gen(function* () {
    const items: Array<A> = [];

    for (const [index, line] of linesOf(text).entries()) {
      if (!isSkipped(line, options.ignore ?? [])) {
        items.push(yield* atLine(index, matchLine(options.item, line).pipe(Result.flatMap(options.make))));
      }
    }

    return items;
  });
}

/**
 * Decode an Orbit text result into `schema`. Parse and validation failures are `SchemaError`s. Results are read-only,
 * so encoding back to Orbit's text is not supported.
 *
 * @param tool
 * @param schema
 * @param parse
 */
function fromText<S extends Schema.Top>(
  tool: string,
  schema: S,
  parse: (text: string) => Result.Result<unknown, string>,
) {
  return Schema.String.pipe(
    Schema.decodeTo(
      schema,
      SchemaTransformation.transformEffect({
        decode: (text, options) =>
          Result.match(parse(text), {
            onSuccess: (encoded) => Effect.succeed(encoded as S['Encoded']),
            onFailure: (message) =>
              Effect.fail(new SchemaIssue.InvalidValue({ message: `${tool}: ${message}` }, text, options)),
          }),
        encode: (value, options) =>
          Effect.fail(new SchemaIssue.Forbidden({ message: `${tool} text cannot be encoded` }, value, options)),
      }),
    ),
  );
}

/**
 * A read-only Orbit tool with typed arguments and a decoder for its text result.
 */
export interface OrbitTool<Args extends Schema.JsonObject, A> {
  readonly name: string;
  readonly decode: (text: string) => Effect.Effect<A, Schema.SchemaError>;
  readonly '~args'?: Args;
}

export function orbitTool<Args extends Schema.JsonObject>() {
  return function make<S extends Schema.Top & { readonly DecodingServices: never }>(
    name: string,
    schema: S,
    parse: (text: string) => Result.Result<unknown, string>,
  ): OrbitTool<Args, S['Type']> {
    return { name, decode: Schema.decodeEffect(fromText(name, schema, parse)) };
  };
}

/**
 * A read-only Orbit tool that returns JSON inside its text block; failures are SchemaErrors with the JSON path.
 */
export function orbitJsonTool<Args extends Schema.JsonObject>() {
  return function make<S extends Schema.Top & { readonly DecodingServices: never }>(
    name: string,
    schema: S,
  ): OrbitTool<Args, S['Type']> {
    return { name, decode: Schema.decodeEffect(schema.pipe(Schema.fromJsonString)) };
  };
}
