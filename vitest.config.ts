import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Two projects rather than one environment, because the two kinds of test
    // here need opposite things. The schema, dev-loop, and fixture suites spawn
    // real processes and read the tree off disk; jsdom gives them nothing and
    // costs every one of them a DOM to set up. The component suite needs the
    // DOM and nothing else. `extends: true` gives both the aliases below.
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "src/**/*.test.ts",
            "src/**/__tests__/**/*.test.ts",
            "tests/unit/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["tests/component/**/*.test.tsx"],
          // jsdom implements no Pointer Events at all, and a widget built on
          // pointer capture has nothing to run against until it does. The setup
          // supplies the constructor and the capture methods.
          setupFiles: ["./tests/component/setup.ts"],
        },
      },
    ],
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
