import * as Effect from 'effect/Effect';

export class CurrentWorkingDirService extends Effect.Service<CurrentWorkingDirService>()('CurrentWorkingDirService', {
  succeed: {
    cwd: Effect.sync(() => process.cwd()),
  },
  accessors: true,
}) {}
