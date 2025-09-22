import { Command, Options } from '@effect/cli';
import { Console, Effect, Option } from 'effect';

import { moduleVersion } from './internal/version';
import { PrettierSetupService } from './services/PrettierSetupService';
import { VsCodeSetupService } from './services/VsCodeSetupService';

const command = Command.make('2d', {
  prettier: Options.boolean('prettier').pipe(
    Options.optional,
    Options.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
  vscode: Options.boolean('vscode').pipe(
    Options.optional,
    Options.withDescription('Setup VSCode settings and recommended extensions for optimal development experience'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier, vscode }) {
        // For optional boolean options:
        // - When not provided: run setup by default
        // - When provided with true: run setup
        // - When provided with false: skip setup
        const shouldSetupPrettier = Option.isNone(prettier) || prettier.value;
        const shouldSetupVscode = Option.isNone(vscode) || vscode.value;

        if (shouldSetupPrettier) {
          yield* Effect.logDebug('Setting up Prettier...');

          const setupService = yield* PrettierSetupService;

          yield* setupService.setup();
        } else {
          yield* Effect.logDebug('Skipping Prettier setup');
        }

        if (shouldSetupVscode) {
          yield* Effect.logDebug('Setting up VSCode configuration...');

          const vscodeSetupService = yield* VsCodeSetupService;

          yield* vscodeSetupService.setup();
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
