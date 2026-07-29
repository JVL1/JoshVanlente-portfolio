import { describe, expect, it } from "vitest";
import { getWorkItem } from "@/lib/content";
import * as workPage from "@/app/work/[slug]/page";

type GenerateMetadata = (args: {
  params: Promise<{ slug: string }>;
}) => Promise<Record<string, unknown>>;

async function generateMetadata(slug: string) {
  const generate = (
    workPage as typeof workPage & { generateMetadata?: GenerateMetadata }
  ).generateMetadata;

  expect(generate).toBeTypeOf("function");

  return generate!({ params: Promise.resolve({ slug }) });
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
        images: [
          {
            url: item!.cover.src,
            width: item!.cover.width,
            height: item!.cover.height,
          },
        ],
        publishedTime: item!.publishedAt,
      },
    });
  });

  it("returns no metadata for the draft fixture", async () => {
    await expect(generateMetadata("draft-fixture")).resolves.toEqual({});
  });

  it("returns no metadata for an unknown slug", async () => {
    await expect(generateMetadata("unknown-work-item")).resolves.toEqual({});
  });
});

describe("site constants", () => {
  it("exports an absolute base URL with no trailing slash", async () => {
    const { site } = await import("@/lib/site");

    expect(() => new URL(site.baseURL)).not.toThrow();
    expect(site.baseURL.endsWith("/")).toBe(false);
  });
});
