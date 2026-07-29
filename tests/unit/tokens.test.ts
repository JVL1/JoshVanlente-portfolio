import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "./helpers/contrast";

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
