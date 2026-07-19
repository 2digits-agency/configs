import * as Brand from 'effect/Brand';
import * as Schema from 'effect/Schema';
import * as SchemaTransformation from 'effect/SchemaTransformation';

/**
 * TeamLeader Orbit uses YYYYMMDDHHMMSS format for dates. Example: "20251117143000" = Nov 17, 2025 14:30:00.
 */
export const TloDateString = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^\d{14}$/)),
  Schema.brand('TloDateString'),
);
export type TloDateString = Schema.Type<typeof TloDateString>;
const makeTloDateString = Brand.nominal<TloDateString>();

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

  return makeTloDateString(`${year}${month}${day}${hour}${minute}${second}`);
}

/**
 * Transform between TLO date strings and JavaScript Date objects.
 */
export const TloDate = TloDateString.pipe(
  Schema.decodeTo(
    Schema.Date,
    SchemaTransformation.transform({
      decode: parseTloDate,
      encode: formatTloDate,
    }),
  ),
);
export type TloDate = Schema.Type<typeof TloDate>;

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
export function TloResponse<$A, $I, $RD, $RE>(dataSchema: Schema.Codec<$A, $I, $RD, $RE>) {
  return Schema.Struct({
    success: Schema.Boolean,
    ID: Schema.optional(Schema.Number),
    OBJ: dataSchema,
    err: Schema.optional(Schema.String),
  });
}
