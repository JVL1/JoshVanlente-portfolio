import type { ReactElement } from "react";
import { profile } from "@/data/profile";
import { site } from "@/lib/site";

/**
 * The Open Graph card's structure and the options it renders under, held here
 * rather than inside `src/app/og/route.tsx` so the tests can read real values.
 *
 * An assertion that matches a source file as a string is satisfied by a comment
 * and broken by one. Mutation testing showed both halves: setting the background
 * to the text colour, which renders the card invisible, kept every token
 * assertion green as long as the right hex sat in a comment above it, and merely
 * naming him in the route's header comment failed a test the card satisfied. An
 * assertion that walks this exported tree cannot be fooled either way, because
 * everything a test needs to judge is a value here.
 *
 * This module imports no `next/og`, so Vitest loads it with no Next machinery in
 * the way. The route keeps `ImageResponse` and the font file read, because the
 * font bytes are a build-time disk read and have no place in a plain module.
 */

/**
 * The weights a font registration may declare. Spelled out here rather than
 * imported from `next/og`, which this module stays clear of so Vitest can load it.
 */
type FaceWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type OgCardOptions = {
  width: number;
  height: number;
  fonts: { name: string; style: "normal"; weight: FaceWeight }[];
};

/**
 * The card prints his name and the role under it, and nothing else. Both strings
 * come from `profile.ts`, so the card cannot say something the rest of the site
 * does not.
 */
export const ogCard: ReactElement = (
  <div
    style={{
      alignItems: "flex-start",
      // Satori rasterizes this tree outside a browser, so a CSS custom property
      // has nothing to resolve against and `var(--color-bg)` comes back empty.
      // These two literals mirror --color-bg and --color-text in
      // src/styles/globals.css. tests/unit/tokens.test.ts reads them out of this
      // tree and fails if either stops matching what ships, or if a third
      // colour appears anywhere in it. AGENTS.md records the exception.
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
);

export const ogCardOptions: OgCardOptions = {
  // Taken from site.ts rather than written again here: og:image:width comes from
  // that object, so a dimension changed in one place and not the other would
  // tell a crawler a size the image does not have.
  width: site.defaultOgImage.width,
  height: site.defaultOgImage.height,
  fonts: [
    {
      name: "Inter",
      style: "normal",
      // public/fonts/Inter.ttf is a static Inter Bold: its OS/2 usWeightClass is
      // 700 and it carries no `fvar` table, so it draws one weight and cannot
      // interpolate another.
      //
      // Declaring 700 changes nothing about today's output. Satori hands the one
      // registered face back for every weight a lookup asks for, so the card
      // rasterized to byte-identical PNGs with this set to 400. The number is
      // here so the registration does not describe the file wrongly, and so a
      // second face added later has a real weight to sort against rather than
      // two entries both filed as 400. tests/unit/og-route.test.ts reads
      // usWeightClass out of the .ttf and fails if the two stop agreeing.
      weight: 700,
    },
  ],
};
