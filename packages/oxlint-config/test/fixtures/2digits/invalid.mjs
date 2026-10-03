import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import * as TestClock from 'effect/testing/TestClock';

export const AnyObject = Schema.Struct({});

export const blocked = Effect.gen(function* () {
  yield* Effect.sleep('1 second');
  yield* TestClock.adjust('1 second');
}).pipe(Effect.provide(TestClock.layer()));
