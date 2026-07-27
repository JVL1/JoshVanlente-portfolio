import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio } from "./helpers/contrast";

const css = readFileSync("src/styles/globals.css", "utf8");

function theme(): Record<string, string> {
  const block = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  if (!block) throw new Error("no @theme block in globals.css");
  const out: Record<string, string> = {};
  for (const [, k, v] of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[k] = v.trim();
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
  it("renders no text below 12px", () => {
    const t = theme();
    for (const [name, value] of Object.entries(t)) {
      if (!name.startsWith("--text-")) continue;
      const px = value.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value);
      expect(px, `${name} is ${px}px`).toBeGreaterThanOrEqual(12);
    }
  });
});
