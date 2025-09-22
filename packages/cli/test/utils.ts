import { Effect, Layer } from "effect"
import { PackageManagerService } from "../src/services/PackageManagerService"
import { PrettierSetupService } from "../src/services/PrettierSetupService"
import { Path } from "@effect/platform"
import { Command } from "@effect/platform"

// Mock the CommandExecutor service that the PackageManagerService depends on
const TestCommandExecutor = Layer.succeed(Command.CommandExecutor, {
  start: (command) => Effect.succeed({
    exitCode: 0,
    stdout: Effect.succeed(""),
    stderr: Effect.succeed("")
  })
})

export const TestPath = Layer.succeed(Path.Path, {
  normalize: (path: string) => path,
  resolve: (...paths: string[]) => paths.join("/")
})

export const TestCommand = Layer.mergeAll(
  TestCommandExecutor,
  Layer.succeed(Command.Command, {
    make: (command: string) => ({ command }),
    runInShell: (background: boolean) => ({ background }),
    start: () => Effect.succeed({
      exitCode: 0,
      stdout: Effect.succeed(""),
      stderr: Effect.succeed("")
    })
  })
)

export const TestPackageManagerService = Layer.succeed(PackageManagerService, {
  resolveRoot: Effect.succeed("/test/workspace"),
  readPackageJson: Effect.succeed({
    name: "test-package",
    version: "1.0.0",
    scripts: {},
    dependencies: {},
    devDependencies: {}
  }),
  writePackageJson: Effect.succeed(undefined),
  addDependencies: Effect.succeed(undefined),
  getPackageManager: Effect.succeed({
    name: "npm",
    version: "9.0.0"
  }),
  runScriptCommand: Effect.succeed("npm run test")
})

export const TestServices = Layer.mergeAll(
  TestPath,
  TestCommand,
  TestPackageManagerService,
  PrettierSetupService.Default
)