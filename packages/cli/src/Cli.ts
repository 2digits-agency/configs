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

        yield* Option.match(prettier, {
          onNone: setupPrettier,
          onSome: (skip) => (skip ? Effect.logDebug('Skipping Prettier setup') : setupPrettier()),
        });

        yield* Option.match(eslint, {
          onNone: () => Effect.logDebug('Skipping ESLint setup'),
          onSome: (setup) => (setup ? setupEslint() : Effect.logDebug('Skipping ESLint setup')),
        });

        yield* Option.match(turbo, {
          onNone: () => Effect.logDebug('Skipping Turborepo setup'),
          onSome: (setup) => (setup ? setupTurborepo() : Effect.logDebug('Skipping Turborepo setup')),
        });
      },
      Effect.tap((options) => Console.log(`Running 2DIGITS Configuration CLI ${moduleVersion} with options:`, options)),
    ),
  ),
);

export const cli = Command.run(command, {
  version: `v${moduleVersion}`,
});
