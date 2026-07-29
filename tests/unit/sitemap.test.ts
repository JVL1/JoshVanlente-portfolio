import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
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
});
