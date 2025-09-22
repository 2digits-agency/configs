import { Command, Options } from '@effect/cli';
import { Console, Effect, Option } from 'effect';

import { moduleVersion } from './internal/version';
import { PrettierSetupService } from './services/PrettierSetupService';

const command = Command.make('2d', {
  prettier: Options.boolean('prettier').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier }) {
        if (Option.isNone(prettier) || !prettier.value) {
          yield* Effect.logDebug('Setting up Prettier...');

          const setupService = yield* PrettierSetupService

          yield* setupService.setup()
        } else {
          yield* Effect.logDebug('Skipping Prettier setup');
        }
      },
      Effect.tap((options) => Console.log(`Running 2DIGITS Configuration CLI ${moduleVersion} with options:`, options)),
    ),
  ),
);

export const cli = Command.run(command, {
  name: '2DIGITS Configuration CLI',
  version: `v${moduleVersion}`,
});
