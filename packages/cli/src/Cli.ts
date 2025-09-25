import { Command, Options } from '@effect/cli';
import { Console, Effect, Option } from 'effect';

import { moduleVersion } from './internal/version';
import { ESLintSetupService } from './services/ESLintSetupService';
import { PrettierSetupService } from './services/PrettierSetupService';
import { TurboSetupService } from './services/TurboSetupService';
import { TypeScriptSetupService } from './services/TypeScriptSetupService';

const command = Command.make('2d', {
  prettier: Options.boolean('prettier').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup Prettier with @2digits/prettier-config'),
  ),
  typescript: Options.boolean('ts').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup TypeScript tsconfig and types script for all workspaces'),
  ),
  eslint: Options.boolean('eslint').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup ESLint and @2digits/eslint-config for all workspaces'),
  ),
  turbo: Options.boolean('turbo').pipe(
    Options.optional,
    Options.withDefault(Option.some(true)),
    Options.withDescription('Setup Turborepo in the root with default tasks and scripts'),
  ),
}).pipe(
  Command.withDescription('Setup the 2DIGITS configs in your project'),
  Command.withHandler(
    Effect.fn('2d')(
      function* ({ prettier, typescript, eslint, turbo }) {
        if (Option.isNone(prettier) || !prettier.value) {
          yield* Effect.logDebug('Setting up Prettier...');
          const setupService = yield* PrettierSetupService;
          yield* setupService.setup();
        } else {
          yield* Effect.logDebug('Skipping Prettier setup');
        }

        if (Option.isNone(typescript) || !typescript.value) {
          yield* Effect.logDebug('Setting up TypeScript...');
          const tsService = yield* TypeScriptSetupService;
          yield* tsService.setup();
        } else {
          yield* Effect.logDebug('Skipping TypeScript setup');
        }

        if (Option.isNone(eslint) || !eslint.value) {
          yield* Effect.logDebug('Setting up ESLint...');
          const esService = yield* ESLintSetupService;
          yield* esService.setup();
        } else {
          yield* Effect.logDebug('Skipping ESLint setup');
        }

        if (Option.isNone(turbo) || !turbo.value) {
          yield* Effect.logDebug('Setting up Turborepo...');
          const tbService = yield* TurboSetupService;
          yield* tbService.setup();
        } else {
          yield* Effect.logDebug('Skipping Turborepo setup');
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
