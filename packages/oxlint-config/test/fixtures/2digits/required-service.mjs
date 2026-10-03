import * as Fx from 'effect/Effect';
import * as Opt from 'effect/Option';

Fx.gen(function* () {
  const logger = yield* Fx.serviceOption(Logger);
  return Opt.getOrThrow(logger);
});
