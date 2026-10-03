import * as Effect from 'effect/Effect';

export const callback = Effect.runSync(Effect.callback((resume) => resume(Effect.succeed(42))));
export const timeout = Effect.runSync(Effect.succeed(42).pipe(Effect.timeout(100)));
export const sleep = Effect.runSync(Effect.sleep(0));
export const delay = Effect.runSync(Effect.succeed(42).pipe(Effect.delay(0)));
