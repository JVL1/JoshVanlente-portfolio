import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ogCard, ogCardOptions } from "@/lib/og-card";

/**
 * The one Open Graph card, serving the three pages that have no cover image of
 * their own: `/`, `/work`, and `/about`. Every write-up sets its own `cover` and
 * overrides `og:image`, so this card never stands in for a specific piece of
 * work and has nothing to say about one. It says who he is.
 *
 * The card's structure and its render options live in `src/lib/og-card.tsx`.
 * What stays here is the part that needs Next and the filesystem: the
 * `ImageResponse` call and the font read.
 *
 * Nothing here varies per request, so Next renders the PNG once during
 * `next build` and serves it as a static file.
 */
export const dynamic = "force-static";

const FONT_PATH = join(process.cwd(), "public/fonts/Inter.ttf");

async function loadInter(): Promise<Buffer> {
  try {
    return await readFile(FONT_PATH);
  } catch (cause) {
    throw new Error(`og card: cannot read the Inter face at ${FONT_PATH}`, {
      cause,
    });
  }
}

export async function GET() {
  const fontData = await loadInter();

  return new ImageResponse(ogCard, {
    width: ogCardOptions.width,
    height: ogCardOptions.height,
    // The descriptors carry the face's name, style, and weight; the bytes are
    // attached here, because reading them is a build-time disk operation.
    fonts: ogCardOptions.fonts.map((face) => ({ ...face, data: fontData })),
  });
}
