import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ogCard } from "@/lib/og-card";
import { contrastRatio } from "./helpers/contrast";
import { styleObjects } from "./helpers/element-tree";

const SRC_DIR = fileURLToPath(new URL("../../src/", import.meta.url));

function readdirRecursive(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? readdirRecursive(join(dir, e.name)) : [join(dir, e.name)],
  );
}

// Resolved from this file rather than the process cwd, so the test reads the real
// token file no matter which directory vitest is invoked from.
const CSS_PATH = fileURLToPath(
  new URL("../../src/styles/globals.css", import.meta.url),
);
const css = readFileSync(CSS_PATH, "utf8");

/**
 * Every `--*` declaration in every `@theme` block.
 *
 * Tailwind 4 merges multiple `@theme` blocks, and CSS lets the last declaration in
 * a block omit its semicolon. An earlier version of this parser matched a single
 * block with a lazy regex and required a trailing semicolon, so a token added in a
 * second block — or as a final unterminated declaration — was invisible to both
 * tests below, which is exactly the drift these tests exist to catch. Walking the
 * braces closes both holes.
 */
function theme(): Record<string, string> {
  const opens = [...css.matchAll(/@theme[^{]*\{/g)];
  if (opens.length === 0) throw new Error("no @theme block in globals.css");

  const out: Record<string, string> = {};
  for (const open of opens) {
    let depth = 0;
    let i = open.index! + open[0].length - 1;
    const start = i + 1;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    if (depth !== 0) throw new Error("unbalanced @theme block in globals.css");

    const body = css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const decl of body.split(";")) {
      const m = decl.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}

/**
 * Every foreground/background pair the components actually render.
 * The criterion is "against its background" — testing every text token against
 * --color-bg alone would miss the code fences and slider labels that sit on
 * --color-surface, and the near-black text on the accent-filled primary CTA.
 */
const PAIRS: [fg: string, bg: string, where: string][] = [
  ["--color-text",         "--color-bg",      "headings, body"],
  ["--color-text-muted",   "--color-bg",      "lede, nav, metric labels, summaries"],
  ["--color-text-subtle",  "--color-bg",      "attribution, years, tags, achievements"],
  ["--color-accent",       "--color-bg",      "headline italic, hover and focus"],
  ["--color-accent-hover", "--color-bg",      "CTA hover"],
  ["--color-text",         "--color-surface", "code fences, slider labels"],
  ["--color-text-muted",   "--color-surface", "code fence comments"],
  ["--color-bg",           "--color-accent",  "primary CTA label on its fill"],
  ["--color-bg",           "--color-accent-hover", "primary CTA label, hovered"],
];

// Tokens that never render text and never sit under it. Rules and dividers only.
const NON_TEXT_TOKENS = ["--color-border", "--color-border-strong", "--color-border-cta"];

describe("contrastRatio", () => {
  // Every colour assertion below rests on this maths, so pin it against the two
  // ratios WCAG 2.x fixes by definition.
  it("matches the WCAG 2.x endpoints", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 4);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 4);
    expect(contrastRatio("#7f7f7f", "#7f7f7f")).toBeCloseTo(1, 4);
  });

  it("expands three-digit hex", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 4);
  });

  it("rejects a value that is not a hex colour", () => {
    expect(() => contrastRatio("oklch(0.5 0 0)", "#000")).toThrow(/hex colour/);
  });
});

describe("colour tokens", () => {
  it("clears WCAG AA 4.5:1 for every rendered foreground/background pair", () => {
    const t = theme();
    for (const [fg, bg, where] of PAIRS) {
      const ratio = contrastRatio(t[fg], t[bg]);
      expect(ratio, `${fg} on ${bg} (${where}) measured ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("accounts for every colour token", () => {
    const declared = Object.keys(theme()).filter((k) => k.startsWith("--color-"));
    const used = new Set([...PAIRS.flatMap(([fg, bg]) => [fg, bg]), ...NON_TEXT_TOKENS]);
    const unaccounted = declared.filter((k) => !used.has(k));
    expect(unaccounted, "a new colour token must appear in PAIRS or NON_TEXT_TOKENS").toEqual([]);
  });
});

describe("type scale", () => {
  // Only units whose rendered size this test can compute. An earlier version read
  // every non-rem value as pixels, so `--text-micro: 12%` cleared the floor while
  // rendering near 2px. An unmeasurable unit now fails instead of passing.
  const ROOT_PX = 16;

  it("renders no text below 12px", () => {
    const t = theme();
    for (const [name, value] of Object.entries(t)) {
      if (!name.startsWith("--text-")) continue;
      // Tailwind 4 hangs modifiers off a token with a second `--`, as in
      // `--text-xs--line-height: 1.5`. Those are ratios and line heights, not
      // font sizes, so they are not subject to the 12px floor.
      if (name.slice(2).includes("--")) continue;
      const m = value.match(/^(-?[\d.]+)(rem|px)$/);
      expect(
        m,
        `${name} is "${value}" — this test measures rem and px only. Use one of those, ` +
          `or teach the test the new unit; an unmeasurable unit must not clear the 12px floor.`,
      ).not.toBeNull();
      const px = m![2] === "rem" ? parseFloat(m![1]) * ROOT_PX : parseFloat(m![1]);
      expect(px, `${name} is ${px}px`).toBeGreaterThanOrEqual(12);
    }
  });

  // Tailwind 4 does not clear the sibling --text-*--line-height key when you
  // override --text-*, so its own default survives and every utility using that
  // size renders at leading derived from a font size the site does not use:
  // text-xl shipped 18px text at calc(1.75 / 1.25), the leading Tailwind
  // computed for its 20px original. Pairing each size with a line-height is the
  // only way to own both halves of the utility.
  it("pairs every type size with an explicit line-height", () => {
    const t = theme();
    const sizes = Object.keys(t).filter(
      (name) => name.startsWith("--text-") && !name.slice(2).includes("--"),
    );
    expect(sizes.length, "no --text-* tokens found").toBeGreaterThan(0);

    const unpaired = sizes.filter((name) => t[`${name}--line-height`] === undefined);
    expect(
      unpaired,
      "an unpaired size inherits Tailwind's default leading for its own original size",
    ).toEqual([]);
  });
});

describe("the OG card's sanctioned raw hex", () => {
  // Satori rasterizes the card outside a browser, so `var(--color-bg)` resolves
  // to nothing and the card has to write the literal values. AGENTS.md records
  // the exception; this pins it. globals.css is still read off disk, so the
  // expected side cannot drift from what ships.
  //
  // The card's side is read out of the exported element tree rather than out of
  // src/app/og/route.tsx as text. Reading the text, both assertions here passed
  // together under a mutation that set `background: "#eceeec"`, the text colour,
  // which renders the card invisible, with the correct hexes left in a comment
  // above it. A comment cannot satisfy an assertion about a style object.
  const cardStyles = styleObjects(ogCard);

  // Properties that can carry a colour. `border`, `outline`, and `boxShadow` are
  // shorthands holding more than one, so a value is split into tokens before each
  // is judged.
  const COLOUR_PROP = /colou?r|background|border|outline|fill|stroke|shadow/i;

  // Every notation CSS has for writing a colour out. The regex this replaces
  // looked for `#rrggbb` alone, so `rgb(255, 0, 0)` walked past it untouched.
  const COLOUR_NOTATION =
    /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\([^)]*\)/g;

  // Tokens a colour-capable shorthand may legitimately carry. Any other bare word
  // on such a property is reported as a named colour, so `background: "red"`
  // fails rather than passing for want of a 148-entry lookup table.
  //
  // `transparent` and `currentColor` spend no part of the exception: one adds no
  // ink, and the other repeats the `color` this file already checks. They matter
  // because both are routine on the properties `fill` and `stroke`, and
  // `border: "1px solid transparent"` would otherwise fail as a third colour.
  const NOT_A_COLOUR = new Set([
    "none", "hidden", "solid", "dashed", "dotted", "double", "groove", "ridge",
    "inset", "outset", "inherit", "initial", "revert", "unset", "auto",
    "transparent", "currentcolor",
  ]);

  // A gradient is not one of the notations above, so stripping COLOUR_NOTATION
  // out of `linear-gradient(#0a0b0b, #eceeec)` leaves `linear-gradient(  ,  )`
  // behind, and both the function name and the stray paren were reported as
  // colours. Dropping the call syntax keeps the arguments, so a named colour
  // inside a gradient is still caught.
  const CALL_SYNTAX = /[\w-]+\(|\)/g;

  /** Every colour named by one style object, however it is written. */
  function coloursIn(style: Record<string, unknown>): string[] {
    const found: string[] = [];
    for (const [prop, raw] of Object.entries(style)) {
      const value = String(raw);
      const notated = value.match(COLOUR_NOTATION) ?? [];
      found.push(...notated);
      if (!COLOUR_PROP.test(prop)) continue;
      for (const token of value
        .replace(COLOUR_NOTATION, " ")
        .replace(CALL_SYNTAX, " ")
        .split(/[\s,/]+/)
        .filter(Boolean)) {
        if (/^[-+.\d]/.test(token)) continue; // a length, a number, or a ratio
        if (NOT_A_COLOUR.has(token.toLowerCase())) continue;
        found.push(token);
      }
    }
    return found;
  }

  // coloursIn is the whole basis of the assertion below, so its edges get their
  // own cases. Both of the first two were live false positives: they reported a
  // colour where the style named none, which would have failed the assertion
  // with a value that is not a colour at all.
  describe("coloursIn", () => {
    it("reads no colour from transparent or currentColor", () => {
      expect(coloursIn({ border: "1px solid transparent" })).toEqual([]);
      expect(coloursIn({ fill: "currentColor", stroke: "none" })).toEqual([]);
    });

    it("reads a gradient's arguments rather than its syntax", () => {
      expect(
        coloursIn({ backgroundImage: "linear-gradient(#0a0b0b, #eceeec)" }),
      ).toEqual(["#0a0b0b", "#eceeec"]);
    });

    it("still catches a named colour, inside a gradient as well as alone", () => {
      expect(coloursIn({ background: "red" })).toEqual(["red"]);
      expect(coloursIn({ background: "linear-gradient(red, blue)" })).toEqual([
        "red",
        "blue",
      ]);
    });

    it("still catches a functional notation on any property", () => {
      expect(coloursIn({ color: "rgb(255, 0, 0)" })).toEqual(["rgb(255, 0, 0)"]);
      expect(coloursIn({ boxShadow: "0 0 4px oklch(0.5 0 0)" })).toEqual([
        "oklch(0.5 0 0)",
      ]);
    });
  });

  it("mirrors --color-bg and --color-text exactly", () => {
    const t = theme();

    const filled = cardStyles.filter(
      (s) => s.background !== undefined || s.backgroundColor !== undefined,
    );
    expect(filled, "the card fills exactly one element").toHaveLength(1);
    expect(
      filled[0].background ?? filled[0].backgroundColor,
      "the card's background must be the --color-bg value that ships",
    ).toBe(t["--color-bg"]);

    const inked = cardStyles.filter((s) => s.color !== undefined);
    expect(inked, "the card sets its text colour once").toHaveLength(1);
    expect(
      inked[0].color,
      "the card's text colour must be the --color-text value that ships",
    ).toBe(t["--color-text"]);
  });

  it("spends the exception on those two colours and no others", () => {
    const t = theme();
    const named = new Set(cardStyles.flatMap(coloursIn));

    expect(
      [...named].sort(),
      "a third colour in the OG card is outside the sanctioned exception",
    ).toEqual([t["--color-bg"], t["--color-text"]].sort());
  });

  it("is the only raw colour anywhere in src/", () => {
    // The two assertions above see only the style objects inside ogCard. Inside
    // that surface they are far stronger than the source match they replaced,
    // which required the hexes in src/app/og/route.tsx to equal the two token
    // values; outside it they see nothing at all, so AGENTS.md's "adding a raw
    // hex anywhere else in src/ is still out" needs a scan of its own. Written
    // in the shape of the two `outline` guards below, which AGENTS.md sanctions
    // as the second exception to its ban on asserting against source text: a
    // prohibition has no value form to export.
    const EXEMPT = new Set([
      join(SRC_DIR, "lib/og-card.tsx"), // the exception itself, pinned above
      CSS_PATH, // the token file is where the values are declared
    ]);

    const offenders = readdirRecursive(SRC_DIR)
      .filter((f) => /\.(tsx?|css|mdx)$/.test(f))
      .filter((f) => !EXEMPT.has(f))
      .flatMap((f) =>
        readFileSync(f, "utf8")
          .split("\n")
          // A line that opens as a comment carries nothing that renders, and
          // src/components/mdx/BeforeAfterSlider.tsx explains its choice of
          // token by naming the hex the other one resolves to. Skipping
          // comment-opening lines keeps that explanation legal. Stripping
          // inline comments instead would have to decide whether a `//` inside
          // a string ends the code, and guessing wrong there hides a real
          // colour rather than allowing a comment.
          .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
          .flatMap((line) => line.match(COLOUR_NOTATION) ?? [])
          .map((hit) => `${f}: ${hit}`),
      );

    expect(
      offenders,
      "colour in src/ comes from a token; Satori is the one reason to write a value",
    ).toEqual([]);
  });
});

describe("stylesheet guards", () => {
  // Both of these came out of Task 2's review and are one careless edit from gone.
  it("keeps Tailwind's source scan narrowed to src and content", () => {
    expect(
      css,
      "a bare @import lets Tailwind scan docs/plans/ and inflates the bundle",
    ).toContain('@import "tailwindcss" source(none);');
    expect(css).toContain('@source "../../src";');
    expect(css).toContain('@source "../../content";');
  });

  it("declares a dark colour scheme on html", () => {
    expect(
      css,
      "the site is dark-only; without this, form controls and scrollbars render light",
    ).toMatch(/html\s*\{[^}]*color-scheme:\s*dark/);
  });

  it("lets no component cancel the focus ring", () => {
    // The base ring loses to `focus:outline-none` twice over: utilities is a
    // later layer, and the utility's selector is more specific. AGENTS.md makes
    // the ring an acceptance criterion, so ban the utility rather than rely on
    // nobody reaching for a Tailwind 3 reflex.
    const offenders = readdirRecursive(SRC_DIR)
      .filter((f) => /\.(tsx?|css|mdx)$/.test(f))
      .filter((f) => /\boutline-(none|hidden)\b/.test(readFileSync(f, "utf8")));
    expect(
      offenders,
      "outline-none cancels the :focus-visible ring, which is an acceptance criterion",
    ).toEqual([]);
  });

  it("lets no component cancel the focus ring by the CSS longhand either", () => {
    // A reviewer proposed dodging the scan above by writing the longhand: an
    // inline `outline: none` reads past a string match on `outline-none` while
    // cancelling the same ring. globals.css is exempt because the one
    // sanctioned exception lives there and the test below pins it; a component
    // has no reason to write this at all.
    const offenders = readdirRecursive(SRC_DIR)
      .filter((f) => /\.(tsx?|css|mdx)$/.test(f))
      .filter((f) => f !== CSS_PATH)
      .filter((f) => /outline:\s*(none|0)\b/.test(readFileSync(f, "utf8")));
    expect(
      offenders,
      "outline: none cancels the :focus-visible ring exactly as outline-none does",
    ).toEqual([]);
  });

  it("drops the focus ring only on the skip link's target", () => {
    // <main id="main"> is the whole page column, so the ring traces a rectangle
    // far taller than the viewport and reads as a stray vertical line rather
    // than as focus feedback. Dropping it there is deliberate, and it lives in
    // the token file where it is visible. Pin the rule so a later edit cannot
    // quietly remove it — or widen it past #main onto real controls.
    expect(
      css,
      "the skip target's ring exception must exist and stay scoped to #main",
    ).toMatch(/#main:focus-visible\s*\{\s*outline:\s*none;?\s*\}/);
  });

  it("gates motion, including scrolling, behind prefers-reduced-motion", () => {
    const block = css.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?scroll-behavior:\s*auto\s*!important/,
    );
    expect(
      block,
      "the reduced-motion block must also reset scroll-behavior; duration resets do not affect smooth scrolling",
    ).not.toBeNull();
  });
});
