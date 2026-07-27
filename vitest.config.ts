import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts", "tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src/", import.meta.url).pathname,
      // src/lib/content.ts imports Velite's output through this alias; without it
      // every loader test fails to resolve rather than failing on behavior.
      "#content": new URL("./.velite/", import.meta.url).pathname,
    },
  },
});
