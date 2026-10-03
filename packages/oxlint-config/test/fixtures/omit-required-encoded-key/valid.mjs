import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

export const good = Schema.Struct({
  b: Schema.String.pipe(
    Schema.encodeTo(Schema.optionalKey(Schema.String), {
      decode: SchemaGetter.withDefault(Effect.succeed('default')),
      encode: SchemaGetter.omit(),
    }),
  ),
});
