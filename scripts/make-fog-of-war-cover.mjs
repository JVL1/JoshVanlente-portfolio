// Generates the cover for the fog-of-war write-up.
//
// The write-up compares eval-driven prompt work to a Civilization map in fog of war.
// The cover shows where the work stands and where it is going, with fog between:
// the obvious straight route is a cleared corridor that ends at an X, and the true
// route (the one accent mark) zigzags through explored ground and steps into a
// half-revealed tile. Both ends are marked; the route does not reach the goal,
// because the work has not reached 90%.
//   node scripts/make-fog-of-war-cover.mjs

import sharp from "sharp";

const OUT = "content/work/fog-of-war/cover.webp";

const BG = "#0a0b0b", SURFACE = "#171918", TEXT = "#eceeec", MUTED = "#adb1ac";
const SUBTLE = "#8a8e89", BORDER = "#262a27", ACCENT = "#c8ff2e";
const SANS = "Helvetica, Arial, sans-serif";
const W = 1200, H = 630, M = 72;

const hex = (cx, cy, r) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = ((60 * k - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const label = (x, y, t) =>
  `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" font-family="${SANS}" font-size="15" letter-spacing="2.6" fill="${SUBTLE}">${t}</text>`;

// Five rows of pointy-top tiles on odd-r offsets, centred on the card.
const R = 36, DX = Math.sqrt(3) * R + 5, DY = 1.5 * R + 4;
const ROWS = 5, COLS = 14;
const x0 = (W - 13 * DX) / 2, y0 = 290 - 2 * DY;
const at = (r, c) => [x0 + c * DX + (r % 2 ? DX / 2 : 0), y0 + r * DY];
const k = (r, c) => `${r},${c}`;

const A = [2, 1];   // we are here
const B = [2, 12];  // the goal
const X = [2, 7];   // where the straight route died
// The straight route is known now: its tiles are cleared up to the dead end.
const corridor = new Set([k(2, 5), k(2, 6), k(2, 7)]);
// The true route zigzags through the explored ground; its next tile is half seen.
const route = [[2, 1], [3, 1], [4, 2], [4, 3], [3, 3], [3, 4]];
const NEXT = [4, 5];
const inFog = (r, c) => c >= 5 && c <= 10 && !corridor.has(k(r, c));

let seen = "", under = "", fog = "", clear = "";
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (r % 2 && c === COLS - 1) continue; // keep the right edge even
    const [cx, cy] = at(r, c);
    if (k(r, c) === k(...NEXT)) continue; // drawn on its own below
    if (inFog(r, c)) {
      // An oversized underlay closes the seams, so nothing shows through the fog.
      under += `<polygon points="${hex(cx, cy, R + 5)}" fill="${SURFACE}"/>`;
      fog += `<polygon points="${hex(cx, cy, R)}" fill="url(#hatch)" stroke="${BORDER}" stroke-width="2"/>`;
    } else if (corridor.has(k(r, c))) {
      clear += `<polygon points="${hex(cx, cy, R)}" fill="${BG}" stroke="${BORDER}" stroke-width="2"/>`;
    } else {
      seen += `<polygon points="${hex(cx, cy, R)}" fill="${BG}" stroke="${BORDER}" stroke-width="2"/>`;
    }
  }
}

const [ax, ay] = at(...A), [bx, by] = at(...B), [xx, xy] = at(...X), [nx, ny] = at(...NEXT);
const routePts = route.map(([r, c]) => at(r, c));
const last = routePts[routePts.length - 1];
const s = 12;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="14" stroke="${BORDER}" stroke-width="5"/>
  </pattern>
</defs>
<rect width="${W}" height="${H}" fill="${BG}"/>
${seen}
${under}
${fog}
${clear}
<!-- The next tile on the true route, half revealed. -->
<polygon points="${hex(nx, ny, R + 5)}" fill="${SURFACE}"/>
<polygon points="${hex(nx, ny, R)}" fill="${BG}"/>
<polygon points="${hex(nx, ny, R)}" fill="url(#hatch)" opacity="0.45" stroke="${SUBTLE}" stroke-width="2" stroke-dasharray="6 5"/>

<!-- The obvious route: straight at the goal, down a corridor that ended. -->
<line x1="${ax + R}" y1="${ay}" x2="${xx - 22}" y2="${xy}" stroke="${SUBTLE}" stroke-width="3" stroke-dasharray="10 10"/>
<path d="M${xx - s} ${xy - s} L${xx + s} ${xy + s} M${xx + s} ${xy - s} L${xx - s} ${xy + s}" stroke="${MUTED}" stroke-width="3.5" stroke-linecap="round"/>

<!-- The true route: the one accent mark, zigzagging, then a tentative step. -->
<polyline points="${pts(routePts)}" fill="none" stroke="${ACCENT}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
<line x1="${last[0].toFixed(1)}" y1="${last[1].toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="${ACCENT}" stroke-width="6" stroke-dasharray="2 12" stroke-linecap="round"/>

<!-- Both ends are clear. -->
<polygon points="${hex(ax, ay, R)}" fill="${SURFACE}" stroke="${TEXT}" stroke-width="2.5"/>
<polygon points="${hex(bx, by, R)}" fill="${SURFACE}" stroke="${TEXT}" stroke-width="2.5"/>
<text x="${bx.toFixed(1)}" y="${(by + 8).toFixed(1)}" text-anchor="middle" font-family="${SANS}" font-size="21" font-weight="700" fill="${TEXT}">90%</text>
${label(ax, y0 - R - 18, "WE ARE HERE")}
${label(bx, y0 - R - 18, "THE GOAL")}

<text x="${M}" y="76" font-family="${SANS}" font-size="18" letter-spacing="3.5" fill="${SUBTLE}">FOG OF WAR</text>
<text x="${M}" y="${H - M + 10}" font-family="${SANS}" font-size="42" font-weight="700" fill="${TEXT}">Clear goal. Foggy path.</text>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${BORDER}"/>
</svg>`;

await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(OUT);
console.log(`wrote ${OUT}`);
