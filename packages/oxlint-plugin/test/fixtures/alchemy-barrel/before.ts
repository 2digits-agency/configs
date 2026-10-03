import { ALCHEMY_DEV, RuntimeContext, AdoptPolicy as Policy } from 'alchemy';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

export const dev: Config.Config<boolean> = ALCHEMY_DEV;
export const runtimeContext = RuntimeContext;
export const isDevelopment = Effect.gen(function* () {
  return yield* ALCHEMY_DEV;
});
export const runtimeId = Effect.gen(function* () {
  return (yield* RuntimeContext).id;
});
export const adopt = Policy.adopt;
