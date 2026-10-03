import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});

void Effect.runPromise(Effect.void).then(() => {});
