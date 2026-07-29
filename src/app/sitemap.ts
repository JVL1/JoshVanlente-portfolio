import type { MetadataRoute } from "next";
import { getWorkItems } from "@/lib/content";
import { site } from "@/lib/site";

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
    ...items.map((item) => ({
      url: `${site.baseURL}/work/${item.slug}`,
      lastModified: item.updatedAt ?? item.publishedAt,
      priority: 0.7,
    })),
  ];
}
