import { describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import { site } from "@/lib/site";

describe("robots", () => {
  it("allows every crawler and names the sitemap absolutely", async () => {
    expect(await robots()).toStrictEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${site.baseURL}/sitemap.xml`,
    });
  });

  it("keeps the build-time content guard", async () => {
    // src/lib/content.ts runs its cross-source checks at module scope, so
    // importing it is what fails the build on bad content. Nothing in the returned
    // object depends on it, which is exactly why the import is easy to lose: an
    // organize-imports pass that drops it takes the guard with it.
    //
    // Asserted as behaviour rather than as a line of source. The regex this
    // replaces, `/^import "@\/lib\/content";$/m`, went red on
    // `import '@/lib/content';` with the guard fully intact, so a change of quote
    // style would have broken the build; and reading text alone, it stayed green
    // however neutered content.ts became. Standing broken content behind the real
    // validation proves the failure reaches this route.
    //
    // The stand-in trips the first check content.ts runs: one item whose declared
    // slug disagrees with the file it was parsed from.
    vi.resetModules();
    vi.doMock("#content", () => ({
      work: [
        {
          slug: "renamed",
          sourcePath: "work/original",
          draft: false,
          publishedAt: "2025-01-01",
          roleId: "evernest-staff-pm",
        },
      ],
    }));
    try {
      await expect(import("@/app/robots")).rejects.toThrow(
        /filename does not match its declared slug "renamed"/,
      );
    } finally {
      vi.doUnmock("#content");
      vi.resetModules();
    }
  });
});
