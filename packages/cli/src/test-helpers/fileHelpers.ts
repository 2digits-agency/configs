import { FileSystem, Path } from "@effect/platform"
import { Effect } from "effect"

export interface FileSpec {
  path: string
  content: string
}

/**
 * Creates multiple files with specified content in a single Effect.
 * Automatically creates parent directories as needed.
 */
export const createFiles = (files: ReadonlyArray<FileSpec>) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    // Group files by directory to optimize directory creation
    const directoriesNeeded = new Set<string>()
    for (const file of files) {
      const dir = path.dirname(file.path)
      if (dir !== "." && dir !== "/") {
        directoriesNeeded.add(dir)
      }
    }

    // Create all directories first
    yield* Effect.forEach(
      Array.from(directoriesNeeded),
      (dir) => fs.makeDirectory(dir, { recursive: true }),
      { concurrency: "unbounded" }
    )

    // Write all files
    yield* Effect.forEach(
      files,
      (file) => fs.writeFileString(file.path, file.content),
      { concurrency: "unbounded" }
    )
  })

/**
 * Creates a test file structure in a temporary directory.
 * Returns the temporary directory path.
 * The directory is automatically cleaned up when the scope ends.
 */
export const createTestFileStructure = (
  files: ReadonlyArray<FileSpec>,
  options?: { prefix?: string }
) =>
  Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    // Create temp directory
    const tmpDir = yield* fs.makeTempDirectoryScoped({
      prefix: options?.prefix ?? "test-"
    })

    // Create files with paths relative to temp dir
    const absoluteFiles = files.map((file) => ({
      path: path.join(tmpDir, file.path),
      content: file.content
    }))

    yield* createFiles(absoluteFiles)

    return tmpDir
  })

/**
 * Helper to create test files with auto-generated content
 */
export const createTestFiles = (
  paths: ReadonlyArray<string>,
  contentGenerator: (path: string, index: number) => string = (_, idx) => `file-${idx}`
): ReadonlyArray<FileSpec> =>
  paths.map((path, idx) => ({
    path,
    content: contentGenerator(path, idx)
  }))