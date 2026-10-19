import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export class CurrentWorkingDirService extends Context.Service<CurrentWorkingDirService>()(
  '@2digits/cli/services/CurrentWorkingDirService',
  {
    make: Effect.succeed({
      cwd: Effect.sync(() => process.cwd()),
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
