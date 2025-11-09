import * as Command from '@effect/cli/Command';
import * as Options from '@effect/cli/Options';
import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { moduleVersion } from './internal/version';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';

const command = Command.make('2d', {
  prettier: Options.boolean('prettier').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
  eslint: Options.boolean('eslint').pipe(
    Options.optional,
    Options.withDefault(Option.none()),
    Options.withDescription('Setup ESLint with @2digits/eslint-config'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier, eslint }) {
        if (Option.isNone(prettier) || !prettier.value) {
          yield* Effect.logDebug('Setting up Prettier...');

          const setupService = yield* PrettierSetupService;

          yield* setupService.setup();
        } else {
          yield* Effect.logDebug('Skipping Prettier setup');
        }

        if (Option.isSome(eslint) && eslint.value) {
          yield* Effect.logDebug('Setting up ESLint...');

          const eslintSetupService = yield* EslintSetupService;

          yield* eslintSetupService.setup();
        } else {
          yield* Effect.logDebug('Skipping ESLint setup');
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
