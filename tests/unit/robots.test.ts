import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import { work } from "#content";
import { site } from "@/lib/site";

describe("robots", () => {
  afterEach(() => {
    // The restore lives here rather than in the test's `finally` because a test
    // that exceeds the 5000ms default never reaches its own `finally`, and a
    // `#content` mock left registered then answers for every test after it: the
    // next one fails at content-rules.ts naming content/work/original.mdx, a
    // path that does not exist. `afterEach` runs even after a timed-out test.
    //
    // `vi.doUnmock` only queues the removal. What restores the real module is
    // the `resetModules` below plus the next import, so these two lines have to
    // stay in this order.
    vi.doUnmock("#content");
    vi.resetModules();
  });

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
    // The stand-in is the real collection plus one item broken two ways at once,
    // and the two breaks are what make the message the assertion. content.ts must
    // run assertFilenamesMatchSlugs before it resolves roles, because
    // content-rules.ts builds a resolution error as content/work/<slug>.mdx from
    // the declared slug: run resolution first and the message names
    // content/work/renamed.mdx, a file that does not exist, which is the failure
    // the filename check exists to prevent. Matching on the filename message is
    // therefore not an incidental choice of wording. It is how this test tells
    // which check ran first, and reordering the two lines in content.ts turns it
    // red.
    //
    // Starting from the real collection rather than from this item alone is what
    // makes that red honest. With `work` holding only the broken entry, every
    // real headline slug in profile.ts went unresolved as well, so a reorder
    // failed with a headline-slug message that described the fixture rather than
    // the mistake.
    vi.resetModules();
    vi.doMock("#content", () => ({
      work: [
        ...work,
        {
          slug: "renamed",
          sourcePath: "work/original",
          draft: false,
          publishedAt: "2025-01-01",
          roleId: "no-such-role",
        },
      ],
    }));

    await expect(import("@/app/robots")).rejects.toThrow(
      /filename does not match its declared slug "renamed"/,
    );
  });
});
