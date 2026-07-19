import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Command from 'effect/unstable/cli/Command';
import * as Flag from 'effect/unstable/cli/Flag';

import { moduleVersion } from './internal/version';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { TurborepoSetupService } from './services/TurborepoSetupService';

const command = Command.make('2d', {
  prettier: Flag.boolean('prettier').pipe(
    Flag.optional,
    Flag.withDefault(Option.some(true)),
    Flag.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
  eslint: Flag.boolean('eslint').pipe(
    Flag.optional,
    Flag.withDefault(Option.none()),
    Flag.withDescription('Setup ESLint with @2digits/eslint-config'),
  ),
  turbo: Flag.boolean('turbo').pipe(
    Flag.optional,
    Flag.withDefault(Option.none()),
    Flag.withDescription('Setup Turborepo configuration for monorepo'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier, eslint, turbo }) {
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

        if (Option.isSome(turbo) && turbo.value) {
          yield* Effect.logDebug('Setting up Turborepo...');

          const turborepoSetupService = yield* TurborepoSetupService;

          yield* turborepoSetupService.setup();
        } else {
          yield* Effect.logDebug('Skipping Turborepo setup');
        }
      },
      Effect.tap((options) => Console.log(`Running 2DIGITS Configuration CLI ${moduleVersion} with options:`, options)),
    ),
  ),
);

export const cli = Command.run(command, {
  version: `v${moduleVersion}`,
});
