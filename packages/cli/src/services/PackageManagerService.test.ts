import { FileSystem, Path } from "@effect/platform"
import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { describe, expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { createTestFiles, createTestFileStructure } from "../test-helpers/fileHelpers.js"
import { PackageManagerService } from "./PackageManagerService.js"

const TestLayer = Layer.mergeAll(
  NodeFileSystem.layer,
  NodePath.layer,
  PackageManagerService.Default
)

describe("PackageManagerService", () => {
  it("simple test", () =>
    Effect.gen(function*() {
      const path = yield* Path.Path
      expect(path).toBeDefined()
    }).pipe(
      Effect.provide(Layer.mergeAll(
        NodeFileSystem.layer,
        NodePath.layer
      ))
    ))

  it.scoped("loads ignore patterns from gitignore files", () =>
    Effect.gen(function*() {
      const path = yield* Path.Path
      const fs = yield* FileSystem.FileSystem

      // Create test file structure with a git root ignore
      const testFiles = createTestFiles([
        ".git/HEAD", // mark git repo
        ".gitignore", // we will overwrite content below
        "good.ts",
        "bad.ts"
      ])

      // Ensure .gitignore has content that ignores *.ts files
      testFiles.find((f) => f.path === ".gitignore")!.content = "*.ts\n"

      const tmpDir = yield* createTestFileStructure(testFiles, {
        prefix: "PackageManagerService-ignore-test-"
      })

      // Run service
      const ignorePatterns = yield* PackageManagerService.loadAllIgnorePatterns(tmpDir)

      expect(ignorePatterns).toContain("*.ts")
    }).pipe(
      Effect.provide(TestLayer)
    ))
})