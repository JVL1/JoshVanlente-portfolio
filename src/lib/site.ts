import { profile } from "@/data/profile";

export const site = {
  baseURL: "https://www.joshvanlente.com",
  // src/app/og/route.tsx renders the card at 1920×1080. The dimensions are
  // declared here rather than left implicit because Next emits
  // og:image:width and og:image:height only when the entry is a descriptor
  // object; a bare string produces og:image on its own. Declaring them lets a
  // crawler lay the card out on its first scrape instead of fetching the image
  // to measure it; `/og` is prerendered to a static PNG during `next build`, so
  // these two numbers are fixed at the same moment the file they describe is.
  defaultOgImage: { url: "/og", width: 1920, height: 1080 },
} as const;

/**
 * Build the complete Open Graph block for a static page.
 *
 * Next replaces nested metadata objects instead of merging their fields. A
 * page that sets only `url` therefore drops the layout's site name and image,
 * so every static route uses this one complete shape.
 */
export function websiteOpenGraph(
  url: string,
  title: string,
  description: string,
) {
  return {
    type: "website" as const,
    siteName: profile.name,
    title,
    description,
    url,
    images: [
      {
        ...site.defaultOgImage,
        alt: `${profile.name}, ${profile.role}`,
      },
    ],
  };
}
