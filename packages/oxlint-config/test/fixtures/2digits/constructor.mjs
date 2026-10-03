import { Effect, Fiber, Layer } from 'effect';

Layer.effect(Tag, Effect.gen(function*() {
  yield* Effect.forkChild(loop);
  return {};
}));

Layer.effect(Tag, Effect.gen(function*() {
  const child = yield* Effect.forkChild(loop);
  yield* Fiber.join(child);
  return { send: () => Effect.gen(function*() { yield* Effect.forkChild(loop); }) };
}));
