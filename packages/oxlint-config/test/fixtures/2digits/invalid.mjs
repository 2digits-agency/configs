import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});
export const parsed = Effect.map(Effect.succeed('{'), JSON.parse);
