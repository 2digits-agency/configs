import * as Brand from 'effect/Brand';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as SchemaIssue from 'effect/SchemaIssue';
import * as SchemaTransformation from 'effect/SchemaTransformation';

/**
 * TeamLeader Orbit uses YYYYMMDDHHMMSS format for dates. Example: "20251117143000" = Nov 17, 2025 14:30:00.
 */
export const TloDateString = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{14}$/)),
  Schema.check(
    Schema.makeFilter((value) => {
      const year = Number.parseInt(value.slice(0, 4), 10);

      const normalizedYear = year <= 99 ? year + 1900 : year;

      const month = Number.parseInt(value.slice(4, 6), 10);

      const day = Number.parseInt(value.slice(6, 8), 10);

      const hour = Number.parseInt(value.slice(8, 10), 10);

      const minute = Number.parseInt(value.slice(10, 12), 10);

      const second = Number.parseInt(value.slice(12, 14), 10);

      // Check calendar components in UTC so local daylight-saving transitions do not affect validation.
      const date = DateTime.toDateUtc(DateTime.makeUnsafe(0));

      date.setUTCFullYear(normalizedYear, month - 1, day);

      date.setUTCHours(hour, minute, second, 0);

      return (
        (date.getUTCFullYear() === normalizedYear &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day &&
          date.getUTCHours() === hour &&
          date.getUTCMinutes() === minute &&
          date.getUTCSeconds() === second) ||
        'Expected a valid YYYYMMDDHHMMSS date'
      );
    }),
  ),
  Schema.brand('TloDateString'),
);

export type TloDateString = typeof TloDateString.Type;

/**
 * Format Date to YYYYMMDDHHMMSS string.
 *
 * @param date - Date to format.
 */
function formatTloDate(date: Date): TloDateString {
  const year = date.getFullYear().toString().padStart(4, '0');

  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  const day = date.getDate().toString().padStart(2, '0');

  const hour = date.getHours().toString().padStart(2, '0');

  const minute = date.getMinutes().toString().padStart(2, '0');

  const second = date.getSeconds().toString().padStart(2, '0');

  return TloDateString.make(`${year}${month}${day}${hour}${minute}${second}`);
}

/**
 * Transform between TLO date strings and JavaScript Date objects.
 */
export const TloDate = TloDateString.pipe(
  Schema.decodeTo(
    Schema.Date,
    SchemaTransformation.transformEffect({
      decode: (value, options) =>
        Effect.try({
          try: () => {
            const year = Number.parseInt(value.slice(0, 4), 10);

            return DateTime.makeZonedUnsafe(
              {
                year: year <= 99 ? year + 1900 : year,
                month: Number.parseInt(value.slice(4, 6), 10),
                day: Number.parseInt(value.slice(6, 8), 10),
                hour: Number.parseInt(value.slice(8, 10), 10),
                minute: Number.parseInt(value.slice(10, 12), 10),
                second: Number.parseInt(value.slice(12, 14), 10),
              },
              {
                timeZone: DateTime.zoneMakeLocal(),
                adjustForTimeZone: true,
              },
            ).pipe(DateTime.toDateUtc);
          },
          catch: () => new SchemaIssue.InvalidValue({ message: 'Invalid TLO date' }, value, options),
        }),
      encode: (value, options) =>
        Effect.try({
          try: () => formatTloDate(value),
          catch: () =>
            new SchemaIssue.InvalidValue({ message: 'Date cannot be encoded as YYYYMMDDHHMMSS' }, value, options),
        }),
    }),
  ),
);

export type TloDate = typeof TloDate.Type;

export { formatTloDate };

/**
 * TLO entity IDs are numeric strings.
 */
export type TloId = string & Brand.Brand<'TloId'>;

export const TloId = Brand.nominal<TloId>();

export const TloIdSchema = Schema.String.pipe(Schema.fromBrand('TloId', TloId));

/**
 * Standard TLO API response envelope schema. Note: Most endpoints return data directly without this wrapper. Kept for
 * potential use with endpoints that do use the envelope pattern.
 *
 * @param dataSchema - Data schema to wrap.
 */
export function TloResponse<T, TEncoded = unknown, TDecodingServices = unknown, TEncodingServices = unknown>(
  dataSchema: Schema.Codec<T, TEncoded, TDecodingServices, TEncodingServices>,
) {
  return Schema.Struct({
    success: Schema.Boolean,
    ID: Schema.optional(Schema.Finite),
    OBJ: dataSchema,
    err: Schema.optional(Schema.String),
  });
}
