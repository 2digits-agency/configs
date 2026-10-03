import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});

const events = [];

export function eager() {
  events.push('sent');
  return Effect.void;
}

export function deliberateConstructionCounter() {
  // oxlint-disable-next-line 2digits/no-eager-effect-mutation -- Intentionally count construction, not execution.
  events.push('constructed');
  return Effect.void;
}
