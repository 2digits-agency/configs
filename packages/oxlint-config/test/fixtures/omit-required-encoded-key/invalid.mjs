import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as SchemaGetter from 'effect/SchemaGetter';

export const bad = Schema.Struct({
  b: Schema.String.pipe(
    Schema.encodeTo(Schema.String, {
      decode: SchemaGetter.withDefault(Effect.succeed('default')),
      encode: SchemaGetter.omit(),
    }),
  ),
});
