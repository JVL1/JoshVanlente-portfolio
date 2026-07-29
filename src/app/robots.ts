import type { MetadataRoute } from "next";
import { getWorkItems } from "@/lib/content";
import { site } from "@/lib/site";

export default async function robots(): Promise<MetadataRoute.Robots> {
  await getWorkItems();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${site.baseURL}/sitemap.xml`,
  };
}
