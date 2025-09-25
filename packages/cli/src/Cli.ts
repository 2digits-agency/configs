import { Command, Options } from '@effect/cli';
import { Console, Effect, Option } from 'effect';

import { moduleVersion } from './internal/version';
import { PrettierSetupService } from './services/PrettierSetupService';
import { VSCodeSetupService } from './services/VSCodeSetupService';

const command = Command.make('2d', {
  prettier: Options.boolean('prettier').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
  vscode: Options.boolean('vscode').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup VSCode settings and extension recommendations (.vscode/*)'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier, vscode }) {
        if (Option.isNone(prettier) || !prettier.value) {
          yield* Effect.logDebug('Setting up Prettier...');

          const setupService = yield* PrettierSetupService;

          yield* setupService.setup();
        } else {
          yield* Effect.logDebug('Skipping Prettier setup');
        }

        if (Option.isNone(vscode) || !vscode.value) {
          yield* Effect.logDebug('Setting up VSCode...');

          const vscodeService = yield* VSCodeSetupService;
          yield* vscodeService.setup();
        } else {
          yield* Effect.logDebug('Skipping VSCode setup');
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
