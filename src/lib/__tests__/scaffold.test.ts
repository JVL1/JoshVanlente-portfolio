import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("scaffold", () => {
  it("pins Node 24 in .nvmrc and package.json engines", () => {
    expect(readFileSync(".nvmrc", "utf8").trim()).toBe("24");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.engines.node).toBe(">=24.0.0 <25");
  });

  it("pins velite exactly, with no range specifier", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.devDependencies.velite).toBe("0.4.0");
  });

  it("carries none of the removed template dependencies", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of [
      "next-intl", "yahoo-fantasy", "sass", "@types/cookie", "cookie",
      "react-masonry-css", "next-themes", "prismjs", "@types/prismjs",
      "remixicon", "@floating-ui/react-dom", "classnames",
      "@csstools/postcss-global-data", "postcss-custom-media",
      "postcss-flexbugs-fixes", "postcss-preset-env", "autoprefixer",
    ]) {
      expect(all, `${banned} must not be a dependency`).not.toHaveProperty(banned);
    }
  });
});
