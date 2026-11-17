import * as Schema from 'effect/Schema';

// Oxlint validates rule options against each rule's JSON Schema; these Effect Schemas decode them.

export const TagComparisonOptions = Schema.Struct({
  discriminants: Schema.Array(Schema.String)
    .annotate({
      description: "Discriminant properties checked in addition to `_tag`. Replaces the default `['kind', 'status']`.",
    })
    .pipe(Schema.optionalKey),
}).pipe(Schema.UndefinedOr);

export const SingleUsePrivateFunctionOptions = Schema.Struct({
  maxLines: Schema.Int.pipe(Schema.optionalKey),
}).pipe(Schema.UndefinedOr);
