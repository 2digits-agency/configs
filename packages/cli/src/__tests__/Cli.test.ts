import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { Path } from '@effect/platform';
import { cli } from '../Cli';
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

describe('CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cli command', () => {
    it('should run with default prettier option', async () => {
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

    it('should skip prettier setup when --prettier is true', async () => {
      const TestLayer = Layer.mergeAll(
        MockPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = cli(['node', 'cli', '--prettier', 'true']);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeUndefined();
      expect(mockSetup).not.toHaveBeenCalled();
    });

    it('should run prettier setup when prettier is false', async () => {
      const TestLayer = Layer.mergeAll(
        MockPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = cli(['node', 'cli', '--prettier', 'false']);

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeUndefined();
      expect(mockSetup).toHaveBeenCalled();
    });

    it('should handle help option', async () => {
      const TestLayer = Layer.mergeAll(
        MockPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = cli(['node', 'cli', '--help']);

      // This should not throw an error
      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer))),
      ).resolves.toBeUndefined();
    });

    it('should handle version option', async () => {
      const TestLayer = Layer.mergeAll(
        MockPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = cli(['node', 'cli', '--version']);

      // This should not throw an error
      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer))),
      ).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const FailingPrettierSetupService = Layer.succeed(PrettierSetupService, {
        setup: vi.fn().mockImplementation(() =>
          Effect.fail(new Error('Setup failed')),
        ),
      });

      const TestLayer = Layer.mergeAll(
        FailingPrettierSetupService,
        MockPackageManagerService,
        MockPath,
      );

      const program = cli(['node', 'cli']);

      await expect(
        Effect.runPromise(program.pipe(Effect.provide(TestLayer))),
      ).rejects.toThrow('Setup failed');
    });
  });
});