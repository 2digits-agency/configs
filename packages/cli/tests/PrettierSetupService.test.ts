import { describe, expect, it, layer } from '@effect/vitest';
import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { PackageManagerService } from '../src/services/PackageManagerService';
import { PrettierSetupService } from '../src/services/PrettierSetupService';

// Mock the PackageManagerService for testing
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

const TestLayer = Layer.mergeAll(
  PrettierSetupService.Default.pipe(Layer.provide(MockPackageManagerService)),
  NodeContext.layer,
  Path.layer
);

describe('PrettierSetupService', () => {
  layer(TestLayer)((it) => {
    it.effect('should be created successfully', () =>
      Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        expect(service).toBeDefined();
        expect(service.setup).toBeDefined();
      })
    );

    it.effect('should have setup method that returns Effect', () =>
      Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        const setupEffect = service.setup();
        
        expect(setupEffect).toBeDefined();
        // The setup effect should be callable and return an Effect
        expect(typeof setupEffect).toBe('object');
      })
    );
  });
});