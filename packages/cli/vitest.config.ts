import * as path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["test/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    environment: "node",
    setupFiles: ["./test/setup.ts"]
  },
  resolve: {
    alias: {
      "@2digits/cli": path.join(__dirname, "src")
    }
  }
})