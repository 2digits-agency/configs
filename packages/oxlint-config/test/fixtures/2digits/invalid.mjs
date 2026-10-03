import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});

export const blocked = Effect.callback((_resume) => {
  server.listen(port);
  return Effect.sync(cleanup);
});

// oxlint-disable-next-line 2digits/no-empty-effect-callback -- Scope-managed listener intentionally never completes.
export const listener = Effect.callback((_resume) => {
  server.listen(port);
  return Effect.sync(cleanup);
});
