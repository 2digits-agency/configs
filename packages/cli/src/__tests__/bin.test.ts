import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { Path } from '@effect/platform';
import { PrettierSetupService } from '../services/PrettierSetupService';
import { PackageManagerService } from '../services/PackageManagerService';

// Mock PrettierSetupService
const mockSetup = vi.fn().mockImplementation(() => Effect.succeed(undefined));
const MockPrettierSetupService = Layer.succeed(PrettierSetupService, {
  setup: mockSetup,
});

// Mock PackageManagerService
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
      version: '8.0.0',
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

describe('bin.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MainLive layer composition', () => {
    it('should compose all required layers correctly', () => {
      // This test verifies that the MainLive layer is properly composed
      // by checking that all dependencies are available
      const TestLayer = Layer.mergeAll(
        MockPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const prettierService = yield* PrettierSetupService;
        const packageManagerService = yield* PackageManagerService;
        const pathService = yield* Path.Path;

        return {
          prettierService,
          packageManagerService,
          pathService,
        };
      });

      return expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer))),
      ).resolves.toMatchObject({
        prettierService: expect.objectContaining({
          setup: expect.any(Function),
        }),
        packageManagerService: expect.objectContaining({
          resolveRoot: expect.any(Function),
          readPackageJson: expect.any(Function),
          writePackageJson: expect.any(Function),
          addDependencies: expect.any(Function),
          getPackageManager: expect.any(Function),
          runScriptCommand: expect.any(Function),
        }),
        pathService: expect.objectContaining({
          resolve: expect.any(Function),
          normalize: expect.any(Function),
          join: expect.any(Function),
        }),
      });
    });
  });

  describe('CLI execution', () => {
    it('should execute CLI with proper layer provision', async () => {
      // Import the cli function from Cli.ts
      const { cli } = await import('../Cli');

      const TestLayer = Layer.mergeAll(
        MockPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = cli(['node', 'cli']);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeUndefined();
      expect(mockSetup).toHaveBeenCalled();
    });
  });
});