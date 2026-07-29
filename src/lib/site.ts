export const site = {
  baseURL: "https://www.joshvanlente.com",
  // Task 17 creates src/app/og/route.tsx and renders it at 1920×1080. The
  // dimensions are declared here rather than left implicit because Next emits
  // og:image:width and og:image:height only when the entry is a descriptor
  // object; a bare string produces og:image on its own. Declaring them lets a
  // crawler lay the card out on its first scrape instead of fetching the image
  // to measure it, which matters most for a dynamic edge route that may be cold.
  defaultOgImage: { url: "/og", width: 1920, height: 1080 },
} as const;
