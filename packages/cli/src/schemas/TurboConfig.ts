import * as Schema from 'effect/Schema';

/**
 * The subset of `turbo.json` this CLI reads and writes.
 *
 * The trailing index signature keeps every key the CLI does not know about, so decoding and re-encoding a consumer's
 * `turbo.json` never drops their configuration.
 */
const TurboConfigSchema = Schema.Struct(
  {
    tasks: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
    globalPassThroughEnv: Schema.String.pipe(Schema.Array, Schema.optional),
    ui: Schema.optional(Schema.String),
  },
  Schema.Record({ key: Schema.String, value: Schema.Unknown }),
);

export type TurboConfig = typeof TurboConfigSchema.Type;

/**
 * {@link TurboConfigSchema} over the raw file contents, formatted the way Turborepo writes `turbo.json`.
 */
export const TurboConfigJson = Schema.parseJson(TurboConfigSchema, { space: 2 });
