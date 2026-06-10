import * as Effect from 'effect/Effect';

export class CurrentWorkingDirService extends Effect.Service<CurrentWorkingDirService>()(
  '@2digits/cli/services/CurrentWorkingDirService',
  {
    succeed: {
      cwd: Effect.sync(() => process.cwd()),
    },
    accessors: true,
  },
) {}
