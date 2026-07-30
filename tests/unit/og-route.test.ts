import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { profile } from "@/data/profile";
import { ogCard } from "@/lib/og-card";
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
 *
 * Reading the card's values is only half of it. A later round found that nothing
 * joined the two halves: the assertions below read the exported tree, the route
 * built its own, and swapping the argument to `ImageResponse` for an inline tree
 * shipped a different card at 57905 bytes with every assertion green. The
 * identity check in "what the route hands ImageResponse" is the join.
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

/** The arguments one `new ImageResponse(...)` call was made with. */
type ImageResponseArgs = [element: unknown, options: Record<string, unknown>];

/**
 * A stand-in Request that reports any use of itself.
 *
 * Every trap throws, so what the test asserts is not "the handler ignored the
 * parameter names this fixture happens to spell" but "the handler never looked
 * at the request at all". That closes every query parameter name at once, which
 * a list of fixture URLs cannot: three fixtures spelling `pad` and `heading`
 * said nothing about `?title=`.
 */
function unreadableRequest(): Request {
  const refuse = (what: string): never => {
    throw new Error(`the handler read ${what} off the request`);
  };
  return new Proxy({} as Request, {
    get: (_target, prop) => refuse(`.${String(prop)}`),
    has: (_target, prop) => refuse(`"${String(prop)}" in it`),
    ownKeys: () => refuse("its own keys"),
    getOwnPropertyDescriptor: (_target, prop) =>
      refuse(`the descriptor of .${String(prop)}`),
  });
}

describe("og route", () => {
  it("prerenders rather than running per request", async () => {
    const route = await import("@/app/og/route");

    expect(route.dynamic).toBe("force-static");
    // An edge runtime would put the card back on a live isolate for an image
    // whose content cannot change between requests.
    expect(route).not.toHaveProperty("runtime");
  });

  it("never reads the request Next hands it", async () => {
    const { GET } = await import("@/app/og/route");
    // The handler declares no parameter, so TypeScript will not let a Request be
    // passed to it. Casting past that is the whole point: Next hands the handler
    // a Request at runtime whatever the signature says, so checking the
    // signature proves nothing. `export async function GET(...args: unknown[])`
    // reading the query string reported a `Function.length` of 0 and matched no
    // `/searchParams/`, so it passed both an arity check and a source scan.
    const invoke = GET as unknown as (r: Request) => Promise<Response>;

    // A parameter read here and drawn on the card puts attacker-chosen text on
    // an image served from this domain, so the property wanted is that no
    // parameter is reachable. `const heading = new URL(req.url).searchParams
    // .get("title") ?? profile.name` is the mutation: it survived every fixture
    // URL the previous version rendered, because none of them spelled `title`.
    const response = await invoke(unreadableRequest());

    expect(response.status).toBe(200);
  });

  it("returns the same bytes on every render", async () => {
    const { GET } = await import("@/app/og/route");

    // Request-invariance is the test above; this one is about determinism, which
    // that one cannot see. A card drawing `new Date()` or a counter takes no
    // input from the request and still serves different bytes to two crawlers.
    const render = async (request?: Request): Promise<Buffer> => {
      const invoke = GET as unknown as (r?: Request) => Promise<Response>;
      const response = await invoke(request);
      expect(response.status).toBe(200);
      return Buffer.from(await response.arrayBuffer());
    };

    const plain = await render();
    const again = await render();
    const withRequest = await render(new Request(`${site.baseURL}/og`));

    expect(again.equals(plain), "two renders disagreed").toBe(true);
    expect(withRequest.equals(plain)).toBe(true);
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

  describe("what the route hands ImageResponse", () => {
    /**
     * Run `GET()` with `next/og` replaced by a recorder, and hand back both the
     * arguments it saw and the card module the route drew them from.
     *
     * Both come out of the same module registry generation on purpose.
     * `vi.resetModules()` makes the route re-import `@/lib/og-card`, which
     * builds a fresh element object, so the `ogCard` imported at the top of this
     * file is a different value by then and an identity check against it would
     * fail for a reason that has nothing to do with the route.
     */
    async function captureImageResponse(): Promise<{
      seen: ImageResponseArgs[];
      card: typeof import("@/lib/og-card");
    }> {
      const seen: ImageResponseArgs[] = [];
      vi.resetModules();
      vi.doMock("next/og", () => ({
        ImageResponse: class {
          constructor(...args: ImageResponseArgs) {
            seen.push(args);
          }
        },
      }));
      const { GET } = await import("@/app/og/route");
      const card = await import("@/lib/og-card");
      await GET();
      return { seen, card };
    }

    afterEach(() => {
      // The restores live here rather than in each test's `finally` because a
      // test that exceeds the 5000ms default never reaches its own `finally`,
      // and a `next/og` mock left registered would then answer for every test
      // after it in this file. `afterEach` runs even after a timed-out test, and
      // a real Satori render is a plausible candidate for that timeout.
      //
      // `vi.doUnmock` only queues the removal. What restores the real module is
      // the `resetModules` below plus the next dynamic import, so these two
      // lines have to stay in this order.
      vi.doUnmock("next/og");
      vi.doUnmock("@/data/profile");
      vi.resetModules();
    });

    it("renders the exported card itself rather than a tree of its own", async () => {
      const { seen, card } = await captureImageResponse();

      expect(seen, "GET constructs exactly one ImageResponse").toHaveLength(1);
      // Identity, not shape. `toEqual` against a tree rebuilt here would accept
      // a copy, and a copy is what a mutation of this argument produces: an
      // inline tree, with `void ogCard` left behind to keep the import bound and
      // lint quiet, shipped a different card at 57905 bytes with all 22
      // assertions in the previous round green. Wrapping the real card in an
      // extra `<div style={{ background: "#ffffff" }}>` passed too.
      expect(
        seen[0][0],
        "the route must hand ImageResponse the ogCard og-card.tsx exports",
      ).toBe(card.ogCard);
    });

    it("renders at the size og-card.tsx declares", async () => {
      const { seen, card } = await captureImageResponse();
      const [, options] = seen[0];

      expect(options.width).toBe(card.ogCardOptions.width);
      expect(options.height).toBe(card.ogCardOptions.height);
    });

    it("registers the Inter face at the weight the file actually draws", async () => {
      // Read off the descriptor the route builds, not the one og-card.tsx
      // exports. route.tsx spreads `...face` into a fresh object, so it can
      // override any field the card declared, and an assertion on the export
      // would not see it.
      //
      // The weight has no effect on today's output: Satori hands the single
      // registered face back for every lookup, so 400 and 700 rasterize to
      // byte-identical PNGs. What this pins is that the registration does not
      // describe the file wrongly, which is what keeps a second face added later
      // from being sorted against a number that was never true.
      const { seen } = await captureImageResponse();
      const { fonts } = seen[0][1] as { fonts: Record<string, unknown>[] };

      expect(fonts).toHaveLength(1);
      expect(
        Object.keys(fonts[0]).sort(),
        "a registration carries a name, a style, a weight, and the bytes",
      ).toEqual(["data", "name", "style", "weight"]);
      expect(fonts[0].name).toBe("Inter");
      expect(fonts[0].style).toBe("normal");
      expect(
        fonts[0].weight,
        "the registration must name the usWeightClass public/fonts/Inter.ttf declares",
      ).toBe(faceWeight(FONT_PATH));

      const data = fonts[0].data;
      expect(Buffer.isBuffer(data), "the face's bytes must be attached").toBe(
        true,
      );
      expect(
        (data as Buffer).equals(readFileSync(FONT_PATH)),
        "the attached bytes must be public/fonts/Inter.ttf",
      ).toBe(true);
    });

    it("takes both strings from profile.ts rather than spelling them out", async () => {
      // Stand a different profile in front of the card and the card must follow
      // it. A literal typed into og-card.tsx would keep printing the real name
      // and fail here. This replaces an assertion that searched the route's
      // source for the name, which went red when a comment in the header
      // mentioned him.
      vi.resetModules();
      // Spread the real module rather than listing exports: profile.ts also
      // exports ROLE_IDS and contactLinks, and a factory naming only `profile`
      // would fail as a missing export the moment anything in this graph reached
      // for one of them.
      vi.doMock("@/data/profile", async (importOriginal) => ({
        ...(await importOriginal<typeof import("@/data/profile")>()),
        profile: { name: "Stand In Name", role: "Stand In Role" },
      }));

      const { ogCard: rebuilt } = await import("@/lib/og-card");
      expect(stringLeaves(rebuilt)).toEqual(["Stand In Name", "Stand In Role"]);
    });
  });
});
