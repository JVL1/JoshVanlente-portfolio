import { describe, expect, it } from "vitest";
import sitemap, { lastModified } from "@/app/sitemap";
import { getWorkItems } from "@/lib/content";
import { work } from "#content";

describe("sitemap", () => {
  it("lists every published write-up", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const i of await getWorkItems()) {
      expect(urls).toContain(
        `https://www.joshvanlente.com/work/${i.slug}`,
      );
    }
  });

  it("lists no draft, even one Velite generated", async () => {
    const drafts = work.filter((i) => i.draft);
    // The permanent fixture makes this test fail if draft coverage disappears.
    expect(
      drafts.length,
      "the draft fixture is missing from content/work/",
    ).toBeGreaterThan(0);

    const urls = (await sitemap()).map((e) => e.url);
    for (const d of drafts) {
      expect(
        urls.some((u) => u.includes(d.slug)),
        `draft ${d.slug} leaked`,
      ).toBe(false);
    }
  });

  it("lists the static routes", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const p of ["", "/work", "/about"]) {
      expect(urls).toContain(`https://www.joshvanlente.com${p}`);
    }
  });

  it("lists the three static routes and nothing else beyond the write-ups", async () => {
    const entries = await sitemap();

    expect(entries).toHaveLength(3 + (await getWorkItems()).length);
  });

  // A URL listed twice is a crawl budget spent twice on one page, and it is what
  // a mistaken second spread or a stray hand-written entry looks like.
  it("lists no URL twice", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("dates every write-up from its own frontmatter", async () => {
    const entries = await sitemap();

    for (const item of await getWorkItems()) {
      const entry = entries.find(
        (e) => e.url === `https://www.joshvanlente.com/work/${item.slug}`,
      );
      // No write-up sets updatedAt today, so every lastmod is the publish date,
      // and that concrete value is what this asserts. The version this replaces
      // wrote `item.updatedAt ?? item.publishedAt` on the expected side, which is
      // the production expression recomputed. It could not see which of the two
      // fields wins: reversing them to `publishedAt ?? updatedAt`, which breaks
      // the edit date for good, kept all seven of these tests green.
      expect(
        item.updatedAt,
        `${item.slug} now sets updatedAt, so its lastmod is that date rather than ` +
          `publishedAt. Assert it directly and drop the file from this loop.`,
      ).toBeUndefined();
      expect(entry!.lastModified).toBe(item.publishedAt);
      expect(entry!.priority).toBe(0.7);
    }
  });

  // The other branch of the fallback, which no content file can reach today.
  describe("lastModified", () => {
    it("takes the edit date when frontmatter records one", () => {
      expect(
        lastModified({ publishedAt: "2025-01-01", updatedAt: "2025-06-02" }),
      ).toBe("2025-06-02");
    });

    it("falls back to the publish date when it does not", () => {
      expect(lastModified({ publishedAt: "2025-01-01" })).toBe("2025-01-01");
    });
  });

  it("sends a write-up's date and rank and claims no change frequency", async () => {
    const entries = await sitemap();

    for (const item of await getWorkItems()) {
      const entry = entries.find(
        (e) => e.url === `https://www.joshvanlente.com/work/${item.slug}`,
      )!;
      // Pinning the key set rather than the three values on their own, because
      // `changeFrequency: "daily"` added to every write-up went unnoticed by every
      // assertion in this file. A finished write-up has no edit cadence to
      // promise, and lastmod already tells a crawler what it needs.
      expect(
        Object.keys(entry).sort(),
        "a write-up entry carries a url, a lastmod, and a priority",
      ).toEqual(["lastModified", "priority", "url"]);
    }
  });

  // The homepage outranks the index, which outranks the bio. Crawlers treat
  // priority as relative within one sitemap, so the ordering is the assertion.
  it("ranks and paces the static routes", async () => {
    const entries = await sitemap();
    const at = (path: string) =>
      entries.find((e) => e.url === `https://www.joshvanlente.com${path}`)!;

    expect(at("").priority).toBe(1);
    expect(at("/work").priority).toBe(0.8);
    expect(at("/about").priority).toBe(0.5);

    expect(at("").changeFrequency).toBe("monthly");
    expect(at("/work").changeFrequency).toBe("monthly");
    expect(at("/about").changeFrequency).toBe("yearly");
  });
});
