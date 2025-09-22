import { describe, expect, it, layer } from '@effect/vitest';
import { Path } from '@effect/platform';
import { NodeContext } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

import { PackageManagerService } from '../src/services/PackageManagerService';

const TestLayer = Layer.mergeAll(PackageManagerService.Default, NodeContext.layer, Path.layer);

describe('PackageManagerService', () => {
  layer(TestLayer)((it) => {
    it.effect('should resolve root directory', () =>
      Effect.gen(function* () {
        const service = yield* PackageManagerService;
        const root = yield* service.resolveRoot();
        
        expect(typeof root).toBe('string');
        expect(root.length).toBeGreaterThan(0);
      })
    );

    it.effect('should detect package manager', () =>
      Effect.gen(function* () {
        const service = yield* PackageManagerService;
        const pm = yield* service.getPackageManager();
        
        expect(pm).toBeDefined();
        expect(pm.name).toBeDefined();
        expect(['npm', 'yarn', 'pnpm', 'bun']).toContain(pm.name);
      })
    );

    it.effect('should read package.json', () =>
      Effect.gen(function* () {
        const service = yield* PackageManagerService;
        const pkg = yield* service.readPackageJson();
        
        expect(pkg).toBeDefined();
        expect(pkg.name).toBeDefined();
      })
    );

    it.effect('should generate run script command', () =>
      Effect.gen(function* () {
        const service = yield* PackageManagerService;
        const command = yield* service.runScriptCommand({ script: 'test' });
        
        expect(typeof command).toBe('string');
        expect(command.length).toBeGreaterThan(0);
      })
    );
  });
});