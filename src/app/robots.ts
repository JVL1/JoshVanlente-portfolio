import type { MetadataRoute } from "next";
// Imported for its side effect and nothing else. src/lib/content.ts runs every
// cross-source check at module scope, so importing it is what fails `next build`
// on a bad roleId or a headline pointing at a draft; its getters only hand back
// an already-validated array. robots.txt reads no content, so this line looks
// unused and is one organize-imports pass from deleted, which would drop the
// guard from this route without changing a single character of its output.
import "@/lib/content";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${site.baseURL}/sitemap.xml`,
  };
}
