import type { MetadataRoute } from "next";
import { getWorkItems } from "@/lib/content";
import { site } from "@/lib/site";

/**
 * The `<lastmod>` for a write-up: the day it was last edited when its
 * frontmatter records one, and the day it was published otherwise.
 *
 * Exported so both branches can be tested. No content file sets `updatedAt`
 * today, so a test driven off the content tree only ever reaches the fallback,
 * and asserting the entry against `updatedAt ?? publishedAt` put the production
 * expression on the expected side too: reversing the two operands, which breaks
 * the edit date for good, left that assertion green. A named function takes a
 * fixture instead and pins which field wins.
 */
export function lastModified(item: {
  publishedAt: string;
  updatedAt?: string;
}): string {
  return item.updatedAt ?? item.publishedAt;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getWorkItems();

  return [
    { url: site.baseURL, changeFrequency: "monthly", priority: 1 },
    {
      url: `${site.baseURL}/work`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.baseURL}/about`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    // A write-up carries a lastmod and a priority and no changeFrequency. Its
    // text is finished on the day it ships, so lastmod is the only honest signal
    // there is to send; a frequency would be a claim about future edits that
    // nothing here can keep. tests/unit/sitemap.test.ts pins the key set, so
    // adding one is a deliberate edit rather than a copy from the block above.
    ...items.map((item) => ({
      url: `${site.baseURL}/work/${item.slug}`,
      lastModified: lastModified(item),
      priority: 0.7,
    })),
  ];
}
