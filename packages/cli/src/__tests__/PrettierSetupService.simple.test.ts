import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { Path } from '@effect/platform';
import { PrettierSetupService } from '../services/PrettierSetupService';
import { PackageManagerService } from '../services/PackageManagerService';

// Mock PackageManagerService with simplified mocks
const MockPackageManagerService = Layer.succeed(PackageManagerService, {
  resolveRoot: vi.fn().mockImplementation(() =>
    Effect.succeed('/test/workspace'),
  ),
  readPackageJson: vi.fn().mockImplementation(() =>
    Effect.succeed({
      name: 'test-package',
      version: '1.0.0',
      scripts: {},
    }),
  ),
  writePackageJson: vi.fn().mockImplementation(() =>
    Effect.succeed(undefined),
  ),
  addDependencies: vi.fn().mockImplementation(() =>
    Effect.succeed(undefined),
  ),
  getPackageManager: vi.fn().mockImplementation(() =>
    Effect.succeed({
      name: 'pnpm',
      version: '10.17.0',
      command: 'pnpm',
      lockFile: 'pnpm-lock.yaml',
      files: ['pnpm-workspace.yaml'],
      majorVersion: '10',
      buildMeta: undefined,
      warnings: undefined,
    }),
  ),
  runScriptCommand: vi.fn().mockImplementation(() =>
    Effect.succeed('pnpm run format'),
  ),
});

// Mock Path service
const MockPath = Layer.succeed(Path.Path, {
  resolve: vi.fn((path: string, ...paths: string[]) => {
    return [path, ...paths].join('/');
  }),
  normalize: vi.fn((path: string) => path),
  join: vi.fn((...paths: string[]) => paths.join('/')),
  dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/')),
  basename: vi.fn((path: string) => path.split('/').pop() || ''),
  extname: vi.fn((path: string) => {
    const parts = path.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }),
  isAbsolute: vi.fn((path: string) => path.startsWith('/')),
  relative: vi.fn((from: string, to: string) => to.replace(from, '')),
  sep: '/',
  delimiter: ':',
});

describe('PrettierSetupService (Simple)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('service creation', () => {
    it('should create service with dependencies', async () => {
      const TestLayer = Layer.mergeAll(
        PrettierSetupService.Default,
        MockPackageManagerService,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        return service;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeDefined();
      expect(result.setup).toBeDefined();
      expect(typeof result.setup).toBe('function');
    });
  });

  describe('service methods', () => {
    it('should have setup method', async () => {
      const TestLayer = Layer.mergeAll(
        PrettierSetupService.Default,
        MockPackageManagerService,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PrettierSetupService;
        return typeof service.setup;
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBe('function');
    });
  });
});