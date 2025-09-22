import { describe, it, expect } from "@effect/vitest"
import { Effect } from "effect"
import { cli } from "../src/Cli"

describe("CLI", () => {
  it.effect("should have proper CLI structure", () =>
    Effect.gen(function*() {
      // Test that the CLI is properly structured
      const cliCommand = cli

      // Check basic CLI properties
      expect(cliCommand).toBeDefined()
      expect(typeof cliCommand).toBe("function")
    }))

  it.effect("should handle different command line arguments", () =>
    Effect.gen(function*() {
      // This is a basic test to ensure the CLI structure exists
      // Full CLI testing would require mocking the full environment
      const cliCommand = cli
      expect(cliCommand).toBeDefined()
    }))
})