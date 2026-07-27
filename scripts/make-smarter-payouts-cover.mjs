// Generates the cover for the Smarter Payouts write-up.
//
// That write-up is the one case study with no photographable artifact — it is a
// prediction model behind a payments flow — and its original cover was a reaction
// GIF: 864KB, auto-playing, and a meme on a page whose job is credibility. Every
// figure below is quoted verbatim from the write-up's own Outcomes section, so
// the cover asserts nothing the body does not already support.
//
// The committed asset stays reproducible when the palette changes.
//
//   node scripts/make-smarter-payouts-cover.mjs

import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const OUT = "content/work/smarter-payouts-predictive-model/cover.webp";

// Straight from src/styles/globals.css. Duplicated rather than parsed because
// this runs outside the bundler and the file is a generator, not shipped code.
const BG = "#0a0b0b";
const TEXT = "#eceeec";
const MUTED = "#adb1ac";
const SUBTLE = "#8a8e89";
const ACCENT = "#c8ff2e";
const BORDER = "#262a27";

// 1200x630 is the Open Graph aspect, so the same asset serves as the card image
// without a second crop.
const W = 1200;
const H = 630;

// Generic families only. This rasterizes through librsvg, which resolves system
// fonts and never sees the next/font faces the site itself loads, so naming
// Inter here would silently fall back anyway.
const SANS = "Helvetica, Arial, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${BORDER}" stroke-width="1"/>

  <text x="80" y="104" font-family="${SANS}" font-size="20" letter-spacing="3.5" fill="${SUBTLE}">AZIBO · 2024</text>

  <text x="80" y="290" font-family="${SANS}" font-size="200" font-weight="700" fill="${ACCENT}">35%</text>
  <text x="80" y="344" font-family="${SANS}" font-size="34" fill="${TEXT}">more payouts delivered within two days</text>

  <line x1="80" y1="420" x2="${W - 80}" y2="420" stroke="${BORDER}" stroke-width="1"/>

  <text x="80" y="510" font-family="${SANS}" font-size="76" font-weight="700" fill="${TEXT}">&lt;0.1%</text>
  <text x="80" y="556" font-family="${SANS}" font-size="26" fill="${MUTED}">increase in clawbacks</text>
</svg>`;

await writeFile("/tmp/smarter-payouts-cover.svg", svg);
await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(OUT);
console.log(`wrote ${OUT}`);
