import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { profile } from "@/data/profile";
import { ogCard, ogCardOptions } from "@/lib/og-card";
import { site } from "@/lib/site";
import { stringLeaves, styleObjects } from "./helpers/element-tree";

/**
 * The card's structure and options live in src/lib/og-card.tsx so this file can
 * assert on real values. An earlier version read src/app/og/route.tsx as a string
 * and matched regexes against it, and a mutation pass defeated every assertion it
 * made. Adding `const n = profile.name` and a second `{n}` printed the name twice
 * while a count of `{profile.name}` still found one. Setting the registration to
 * 400 stayed green as long as a comment read `weight: 700`. And extending the
 * route's header comment to mention "Josh Van Lente" failed a test the card
 * satisfied.
 */

const FONT_PATH = fileURLToPath(
  new URL("../../public/fonts/Inter.ttf", import.meta.url),
);

/**
 * The `usWeightClass` field of the font's OS/2 table: the weight the face
 * actually draws. Read from the file rather than written down here, so the
 * assertion below tracks whatever font ships instead of a copy of one number.
 */
function faceWeight(path: string): number {
  const buf = readFileSync(path);
  const tableCount = buf.readUInt16BE(4);
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + i * 16;
    if (buf.toString("ascii", record, record + 4) === "OS/2") {
      return buf.readUInt16BE(buf.readUInt32BE(record + 8) + 4);
    }
  }
  throw new Error(`no OS/2 table in ${path}`);
}

/** How many times `needle` occurs in `haystack`. */
function occurrences(haystack: string, needle: string): number {
  let count = 0;
  for (
    let at = haystack.indexOf(needle);
    at !== -1;
    at = haystack.indexOf(needle, at + 1)
  ) {
    count++;
  }
  return count;
}

describe("og route", () => {
  it("prerenders rather than running per request", async () => {
    const route = await import("@/app/og/route");

    expect(route.dynamic).toBe("force-static");
    // An edge runtime would put the card back on a live isolate for an image
    // whose content cannot change between requests.
    expect(route).not.toHaveProperty("runtime");
  });

  it("returns the same bytes whatever request it is handed", async () => {
    const { GET } = await import("@/app/og/route");

    // The handler declares no parameter, so TypeScript will not let a Request be
    // passed to it. Casting past that is the whole point of this test: Next hands
    // the handler a Request at runtime whatever the signature says, and checking
    // the signature proves nothing. `export async function GET(...args:
    // unknown[])` reading `new URLSearchParams(new URL(req.url).search)` reported
    // a `Function.length` of 0 and matched no `/searchParams/`, so it passed an
    // arity check and a source scan while returning different PNGs for
    // `?pad=400`. Identical bytes is the property actually wanted.
    const render = async (request?: Request): Promise<Buffer> => {
      const invoke = GET as unknown as (r?: Request) => Promise<Response>;
      const response = await invoke(request);
      expect(response.status).toBe(200);
      return Buffer.from(await response.arrayBuffer());
    };

    const plain = await render();
    const padded = await render(
      new Request(`${site.baseURL}/og?pad=400&heading=Hijacked`),
    );
    const other = await render(new Request(`${site.baseURL}/og?pad=1200`));

    expect(
      padded.equals(plain),
      "a query string moved the bytes, so the card varies per request",
    ).toBe(true);
    expect(other.equals(padded)).toBe(true);
  });

  it("renders a PNG at the dimensions site.ts promises crawlers", async () => {
    const { GET } = await import("@/app/og/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");

    const png = Buffer.from(await response.arrayBuffer());
    // A PNG's IHDR chunk is always first: width and height are the two 32-bit
    // big-endian words at offsets 16 and 20.
    const rendered = [png.readUInt32BE(16), png.readUInt32BE(20)];

    // The equality catches the card drifting from what site.ts tells a crawler.
    // Both moving together would still satisfy it, so pin the size the design doc
    // fixes as well.
    expect(rendered).toEqual([
      site.defaultOgImage.width,
      site.defaultOgImage.height,
    ]);
    expect(rendered, "the design doc fixes the card at 1920x1080").toEqual([
      1920, 1080,
    ]);
  });

  it("prints the name once and the role once, and nothing else", () => {
    const leaves = stringLeaves(ogCard);

    // A joined scan as well as the exact list, so one leaf holding the name twice
    // fails too. Joined on a newline, which neither string can contain, so a name
    // split across two elements cannot reassemble across the boundary and count
    // as one printing.
    const printed = leaves.join("\n");
    expect(occurrences(printed, profile.name), "the name is printed once").toBe(
      1,
    );
    expect(occurrences(printed, profile.role), "the role is printed once").toBe(
      1,
    );
    expect(leaves, "the card says his name and his role and nothing else").toEqual(
      [profile.name, profile.role],
    );
  });

  it("takes both strings from profile.ts rather than spelling them out", async () => {
    // Stand a different profile in front of the card and the card must follow it.
    // A literal typed into og-card.tsx would keep printing the real name and fail
    // here. This replaces an assertion that searched the route's source for the
    // name, which went red when a comment in the header mentioned him.
    vi.resetModules();
    vi.doMock("@/data/profile", () => ({
      profile: { name: "Stand In Name", role: "Stand In Role" },
    }));
    try {
      const { ogCard: rebuilt } = await import("@/lib/og-card");
      expect(stringLeaves(rebuilt)).toEqual(["Stand In Name", "Stand In Role"]);
    } finally {
      vi.doUnmock("@/data/profile");
      vi.resetModules();
    }
  });

  it("registers the Inter face at the weight the file actually draws", () => {
    // The weight has no effect on today's output: Satori hands the single
    // registered face back for every lookup, so 400 and 700 rasterize to
    // byte-identical PNGs. What this pins is that the registration does not
    // describe the file wrongly, which is what keeps a second face added later
    // from being sorted against a number that was never true. Read out of the
    // exported options object, because a comment reading `weight: 700` satisfied
    // the source match while the shipped value was 400.
    expect(ogCardOptions.fonts).toHaveLength(1);
    expect(ogCardOptions.fonts[0].name).toBe("Inter");
    expect(
      ogCardOptions.fonts[0].weight,
      "the registration must name the usWeightClass public/fonts/Inter.ttf declares",
    ).toBe(faceWeight(FONT_PATH));
  });

  it("asks no element for a weight the one registered face cannot draw", () => {
    // Satori ignores a `fontWeight` here, so this changes nothing that renders.
    // It keeps the tree from promising a distinction the face cannot make, which
    // the next person to read it would otherwise believe.
    const asking = styleObjects(ogCard).filter((style) => "fontWeight" in style);
    expect(
      asking,
      "a single-weight face cannot render a fontWeight distinction",
    ).toEqual([]);
  });
});
