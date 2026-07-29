import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";
import { site } from "@/lib/site";

/**
 * The one Open Graph card, serving the three pages that have no cover image of
 * their own: `/`, `/work`, and `/about`. Every write-up sets its own `cover` and
 * overrides `og:image`, so this card never stands in for a specific piece of
 * work and has nothing to say about one. It says who he is.
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

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          // Satori rasterizes this tree outside a browser, so a CSS custom
          // property has nothing to resolve against and `var(--color-bg)` comes
          // back empty. These two literals mirror --color-bg and --color-text in
          // src/styles/globals.css, and tests/unit/tokens.test.ts fails if they
          // stop matching. AGENTS.md records the exception.
          background: "#0a0b0b",
          color: "#eceeec",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter",
          height: "100%",
          justifyContent: "center",
          padding: 160,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 140,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          {profile.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
            marginTop: 40,
          }}
        >
          {profile.role}
        </div>
      </div>
    ),
    {
      // Taken from site.ts rather than written again here: og:image:width comes
      // from that object, so a dimension changed in one place and not the other
      // would tell a crawler a size the image does not have.
      width: site.defaultOgImage.width,
      height: site.defaultOgImage.height,
      fonts: [
        {
          name: "Inter",
          data: fontData,
          style: "normal",
          // public/fonts/Inter.ttf is a static Inter Bold: its OS/2
          // usWeightClass is 700 and it carries no `fvar` table, so it draws one
          // weight and cannot interpolate another. Registered without a weight
          // it was filed as 400, and Satori then returned Bold for every weight
          // the card asked for: the same string at 400 and at 600 rasterized to
          // byte-identical PNGs. Declaring 700 makes the registration match the
          // file, which is why no element below asks for a weight of its own.
          weight: 700,
        },
      ],
    },
  );
}
