import * as Brand from 'effect/Brand';
import * as Schema from 'effect/Schema';

/**
 * TeamLeader Orbit uses YYYYMMDDHHMMSS format for dates. Example: "20251117143000" = Nov 17, 2025 14:30:00.
 */
export const TloDateString = Schema.String.pipe(Schema.pattern(/^\d{14}$/), Schema.brand('TloDateString'));
export type TloDateString = typeof TloDateString.Type;

/**
 * Parse YYYYMMDDHHMMSS string to Date.
 *
 * @param dateString - String to parse.
 */
function parseTloDate(dateString: string): Date {
  const year = Number.parseInt(dateString.slice(0, 4), 10);
  const month = Number.parseInt(dateString.slice(4, 6), 10) - 1;
  const day = Number.parseInt(dateString.slice(6, 8), 10);
  const hour = Number.parseInt(dateString.slice(8, 10), 10);
  const minute = Number.parseInt(dateString.slice(10, 12), 10);
  const second = Number.parseInt(dateString.slice(12, 14), 10);

  return new Date(year, month, day, hour, minute, second);
}

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

  return `${year}${month}${day}${hour}${minute}${second}` as TloDateString;
}

/**
 * Transform between TLO date strings and JavaScript Date objects.
 */
export const TloDate = Schema.transform(TloDateString, Schema.DateFromSelf, {
  strict: true,
  decode: parseTloDate,
  encode: formatTloDate,
});
export type TloDate = typeof TloDate.Type;

export { formatTloDate };

/**
 * TLO entity IDs are numeric strings.
 */
export type TloId = string & Brand.Brand<'TloId'>;
export const TloId = Brand.nominal<TloId>();

export const TloIdSchema = Schema.String.pipe(Schema.fromBrand(TloId));

/**
 * Standard TLO API response envelope schema. Note: Most endpoints return data directly without this wrapper. Kept for
 * potential use with endpoints that do use the envelope pattern.
 *
 * @param dataSchema - Data schema to wrap.
 */
export function TloResponse<$A, $I, $R>(dataSchema: Schema.Schema<$A, $I, $R>) {
  return Schema.Struct({
    success: Schema.Boolean,
    ID: Schema.optional(Schema.Number),
    OBJ: dataSchema,
    err: Schema.optional(Schema.String),
  });
}
