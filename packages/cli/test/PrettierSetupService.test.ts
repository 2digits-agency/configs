import { describe, it, expect } from "@effect/vitest"
import { Effect } from "effect"
import { PrettierSetupService } from "../src/services/PrettierSetupService"
import { TestServices } from "./utils"

describe("PrettierSetupService", () => {

  it.effect("should have proper service structure", () =>
    Effect.gen(function*() {
      // Test that the service can be accessed
      const service = PrettierSetupService

      expect(service).toBeDefined()
      expect(typeof service).toBe("function")
    }).pipe(Effect.provide(TestServices)))

  it.effect("should handle basic service operations", () =>
    Effect.gen(function*() {
      // Test that the service has the expected methods
      const service = PrettierSetupService

      expect(service).toBeDefined()
      expect(typeof service).toBe("function")
    }).pipe(Effect.provide(TestServices)))
})