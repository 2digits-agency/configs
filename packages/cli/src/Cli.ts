import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Command from 'effect/cli/Command';
import * as Flag from 'effect/cli/Flag';

import { moduleVersion } from './internal/version';
import { EslintSetupService } from './services/EslintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { TurborepoSetupService } from './services/TurborepoSetupService';

const setupPrettier = Effect.fn('2d.setupPrettier')(function* () {
  yield* Effect.logDebug('Setting up Prettier...');

  const setupService = yield* PrettierSetupService;

  yield* setupService.setup();
});

const setupEslint = Effect.fn('2d.setupEslint')(function* () {
  yield* Effect.logDebug('Setting up ESLint...');

  const eslintSetupService = yield* EslintSetupService;

  yield* eslintSetupService.setup();
});

const setupTurborepo = Effect.fn('2d.setupTurborepo')(function* () {
  yield* Effect.logDebug('Setting up Turborepo...');

  const turborepoSetupService = yield* TurborepoSetupService;

  yield* turborepoSetupService.setup();
});

const command = Command.make('2d', {
  prettier: Flag.Boolean('prettier').pipe(
    Flag.withDefault(true),
    Flag.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
  eslint: Flag.Boolean('eslint').pipe(
    Flag.withDefault(false),
    Flag.withDescription('Setup ESLint with @2digits/eslint-config'),
  ),
  turbo: Flag.Boolean('turbo').pipe(
    Flag.withDefault(false),
    Flag.withDescription('Setup Turborepo configuration for monorepo'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier, eslint, turbo }) {
        yield* prettier ? setupPrettier() : Effect.logDebug('Skipping Prettier setup');

        yield* eslint ? setupEslint() : Effect.logDebug('Skipping ESLint setup');

        yield* turbo ? setupTurborepo() : Effect.logDebug('Skipping Turborepo setup');
      },
      Effect.tap((options) => Console.log(`Running 2DIGITS Configuration CLI ${moduleVersion} with options:`, options)),
    ),
  ),
);

export const cli = Command.run(command, {
  version: `v${moduleVersion}`,
});
