import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import robots from "@/app/robots";
import { site } from "@/lib/site";

const ROBOTS_PATH = fileURLToPath(
  new URL("../../src/app/robots.ts", import.meta.url),
);

describe("robots", () => {
  it("allows every crawler and names the sitemap absolutely", async () => {
    expect(await robots()).toStrictEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${site.baseURL}/sitemap.xml`,
    });
  });

  it("keeps the build-time content guard", () => {
    // src/lib/content.ts runs its cross-source checks at module scope, so
    // importing it is what fails the build on bad content. Nothing in the
    // returned object depends on it, which is exactly why the import is easy to
    // lose: an organize-imports pass that drops it takes the guard with it.
    expect(readFileSync(ROBOTS_PATH, "utf8")).toMatch(
      /^import "@\/lib\/content";$/m,
    );
  });
});
