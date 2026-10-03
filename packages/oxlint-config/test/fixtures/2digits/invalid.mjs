import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});
export const result = Effect.runSync(Effect.promise(() => Promise.resolve(42)));
