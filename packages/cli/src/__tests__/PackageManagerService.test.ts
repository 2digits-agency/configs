import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer, TestContext } from 'effect';
import { Path } from '@effect/platform';
import { PackageManagerService } from '../services/PackageManagerService';

// Mock external dependencies
vi.mock('pkg-types', () => ({
  findWorkspaceDir: vi.fn().mockResolvedValue('/test/workspace'),
  readPackageJSON: vi.fn().mockResolvedValue({
    name: 'test-package',
    version: '1.0.0',
    scripts: {},
  }),
  writePackageJSON: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('nypm', () => ({
  detectPackageManager: vi.fn().mockResolvedValue({
    name: 'pnpm',
    version: '10.17.0',
    command: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    files: ['pnpm-workspace.yaml'],
    majorVersion: '10',
    buildMeta: undefined,
    warnings: undefined,
  }),
  addDependencyCommand: vi.fn().mockReturnValue('pnpm add --save-dev'),
  runScriptCommand: vi.fn().mockReturnValue('pnpm run format'),
}));

// Mock dependencies
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

describe('PackageManagerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveRoot', () => {
    it('should resolve workspace root', async () => {
      const TestLayer = Layer.mergeAll(
        PackageManagerService.Default,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PackageManagerService;
        return yield* service.resolveRoot();
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('readPackageJson', () => {
    it('should read package.json from specified path', async () => {
      const TestLayer = Layer.mergeAll(
        PackageManagerService.Default,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PackageManagerService;
        return yield* service.readPackageJson({ id: '/test/path' });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toEqual({
        name: 'test-package',
        version: '1.0.0',
        scripts: {},
      });
    });
  });

  describe('writePackageJson', () => {
    it('should write package.json to specified path', async () => {
      const mockPackageJson = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {},
      };

      const TestLayer = Layer.mergeAll(
        PackageManagerService.Default,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PackageManagerService;
        return yield* service.writePackageJson({
          id: '/test/path',
          content: mockPackageJson,
        });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBeUndefined();
    });
  });

  describe('getPackageManager', () => {
    it('should detect package manager', async () => {
      const TestLayer = Layer.mergeAll(
        PackageManagerService.Default,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PackageManagerService;
        return yield* service.getPackageManager();
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toEqual({
        name: 'pnpm',
        version: '10.17.0',
        command: 'pnpm',
        lockFile: 'pnpm-lock.yaml',
        files: ['pnpm-workspace.yaml'],
        majorVersion: '10',
        buildMeta: undefined,
        warnings: undefined,
      });
    });
  });

  describe('runScriptCommand', () => {
    it('should generate script command', async () => {
      const TestLayer = Layer.mergeAll(
        PackageManagerService.Default,
        MockPath,
      );

      const program = Effect.gen(function* () {
        const service = yield* PackageManagerService;
        return yield* service.runScriptCommand({ script: 'format' });
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TestLayer)),
      );

      expect(result).toBe('pnpm run format');
    });
  });
});