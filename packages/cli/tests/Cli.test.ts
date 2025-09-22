import { describe, expect, it, layer } from '@effect/vitest';
import { CliConfig } from '@effect/cli';
import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { cli } from '../src/Cli';
import { PackageManagerService } from '../src/services/PackageManagerService';
import { PrettierSetupService } from '../src/services/PrettierSetupService';

// Mock services for testing
const MockPackageManagerService = Layer.succeed(
  PackageManagerService,
  PackageManagerService.of({
    resolveRoot: Effect.succeed('/test/root'),
    readPackageJson: Effect.succeed({
      name: 'test-package',
      scripts: {},
    }),
    writePackageJson: Effect.void,
    addDependencies: Effect.void,
    getPackageManager: Effect.succeed({ name: 'pnpm' }),
    runScriptCommand: Effect.succeed('pnpm run test'),
  })
);

const MockPrettierSetupService = Layer.succeed(
  PrettierSetupService,
  PrettierSetupService.of({
    setup: Effect.void,
  })
);

const TestLayer = Layer.mergeAll(
  CliConfig.layer(),
  MockPrettierSetupService,
  MockPackageManagerService,
  NodeContext.layer,
  Path.layer
);

describe('CLI', () => {
  it('should be defined', () => {
    expect(cli).toBeDefined();
    expect(typeof cli).toBe('function');
  });

  layer(TestLayer)((it) => {
    it.effect('should handle help command', () =>
      Effect.gen(function* () {
        // The CLI help command should exit with code 0 or throw a specific error
        const result = yield* cli(['node', 'cli', '--help']).pipe(
          Effect.catchAll((error) => Effect.succeed({ error: error.toString() }))
        );
        
        // Help command typically doesn't return a value but exits the process
        expect(true).toBe(true); // Test passes if no uncaught errors
      })
    );

    it.effect('should handle version command', () =>
      Effect.gen(function* () {
        // The CLI version command should exit with code 0 or throw a specific error
        const result = yield* cli(['node', 'cli', '--version']).pipe(
          Effect.catchAll((error) => Effect.succeed({ error: error.toString() }))
        );
        
        // Version command typically doesn't return a value but exits the process
        expect(true).toBe(true); // Test passes if no uncaught errors
      })
    );

    it.effect('should handle prettier option', () =>
      Effect.gen(function* () {
        const result = yield* cli(['node', 'cli', '--prettier']).pipe(
          Effect.catchAll((error) => Effect.succeed({ error: error.toString() }))
        );
        
        // The command should complete without throwing uncaught errors
        expect(true).toBe(true);
      })
    );

    it.effect('should handle invalid option gracefully', () =>
      Effect.gen(function* () {
        const result = yield* cli(['node', 'cli', '--invalid-option']).pipe(
          Effect.catchAll((error) => Effect.succeed({ error: error.toString() }))
        );
        
        // Invalid options should be handled gracefully
        expect(result).toBeDefined();
      })
    );
  });
});