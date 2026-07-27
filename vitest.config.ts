import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts", "tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // fileURLToPath rather than .pathname: .pathname keeps percent-encoding,
      // so a checkout under a directory with a space in its name would alias to
      // a path containing %20 and fail as an unresolved module.
      "@": fileURLToPath(new URL("./src/", import.meta.url)),
      // src/lib/content.ts imports Velite's output through this alias; without it
      // every loader test fails to resolve rather than failing on behavior.
      "#content": fileURLToPath(new URL("./.velite/", import.meta.url)),
    },
  },
});
