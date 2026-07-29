import { describe, expect, it } from "vitest";
import { profile } from "@/data/profile";
import { getWorkItem } from "@/lib/content";
// Imported by name rather than through a namespace cast. The cast this replaced
// typed the export as optional and its return as Record<string, unknown>, so
// deleting generateMetadata from the page left `npm run typecheck` green and the
// failure showed up only at runtime.
import { generateMetadata as pageGenerateMetadata } from "@/app/work/[slug]/page";

function generateMetadata(slug: string) {
  return pageGenerateMetadata({ params: Promise.resolve({ slug }) });
}

describe("work item metadata", () => {
  it("returns metadata from the published work item", async () => {
    const slug = "cutting-six-of-seven-steps";
    const item = await getWorkItem(slug);

    expect(item).not.toBeNull();

    const metadata = await generateMetadata(slug);

    expect(metadata).toMatchObject({
      title: item!.title,
      description: item!.summary,
      alternates: { canonical: `/work/${item!.slug}` },
      openGraph: {
        type: "article",
        // Next replaces the parent openGraph block rather than merging it, so a
        // write-up that omits siteName loses the attribution line on its card.
        siteName: profile.name,
        url: `/work/${item!.slug}`,
        images: [
          {
            url: item!.cover.src,
            width: item!.cover.width,
            height: item!.cover.height,
          },
        ],
        publishedTime: item!.publishedAt,
        // No write-up sets updatedAt today, so this always takes the `??`
        // fallback. Asserting it means a regression that dropped item.updatedAt
        // fails here rather than the first time someone sets it in frontmatter
        // and article:modified_time silently stops moving.
        modifiedTime: item!.updatedAt ?? item!.publishedAt,
      },
    });
  });

  // Distinguishable from the unknown-slug case below only because draft-fixture
  // really is in #content: Velite does not filter drafts, and
  // content-tree.test.ts pins that the fixture exists and is the only one.
  // Deleting the filter in content-rules.ts makes this line fail.
  it("returns no metadata for the draft fixture", async () => {
    await expect(generateMetadata("draft-fixture")).resolves.toStrictEqual({});
  });

  // toStrictEqual rather than toEqual: toEqual ignores keys whose value is
  // undefined, so a shaped-but-empty return would satisfy it.
  it("returns no metadata for an unknown slug", async () => {
    await expect(
      generateMetadata("unknown-work-item"),
    ).resolves.toStrictEqual({});
  });
});

describe("site constants", () => {
  it("exports an absolute base URL with no trailing slash", async () => {
    const { site } = await import("@/lib/site");

    expect(() => new URL(site.baseURL)).not.toThrow();
    expect(site.baseURL.endsWith("/")).toBe(false);
  });

  // A bare string emits og:image and nothing else. The descriptor form is what
  // gets og:image:width and og:image:height onto the page, so pin the shape.
  it("describes the default OG image with the dimensions Task 17 renders", async () => {
    const { site } = await import("@/lib/site");

    expect(site.defaultOgImage).toStrictEqual({
      url: "/og",
      width: 1920,
      height: 1080,
    });
  });
});
