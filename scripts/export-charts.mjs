// Rasterizes the pipeline-drift charts from their SVG sources.
//
// These two diagrams are hand-authored vector, not photographs, so they get a
// re-runnable exporter rather than a slot in scripts/resize-images.mjs. That
// script deletes each source once it converts, which is right for a one-time
// photo migration and exactly wrong here — running the charts through it would
// destroy the editable original, which is the mistake that lost these files
// once already.
//
// Idempotent: run it as often as you like.
//
//   node scripts/export-charts.mjs

import { statSync } from "node:fs";
import sharp from "sharp";

const DIR = "public/images/blog/pipeline-drift";

// 1600px matches the body-image width used everywhere else: prose renders at
// roughly 760px, so this covers 2x DPR.
const WIDTH = 1600;
const QUALITY = 82;

for (const name of ["drift-budget", "generative-passes"]) {
  const src = `${DIR}/${name}.svg`;
  const out = `${DIR}/${name}.webp`;
  await sharp(src, { density: 144 })
    .resize({ width: WIDTH })
    .webp({ quality: QUALITY })
    .toFile(out);
  // statSync, not sharp's metadata — metadata() reports no size for WebP, so
  // reading it there printed a confident 0KB for a file that was written fine.
  console.log(`${src} -> ${out}  ${Math.round(statSync(out).size / 1024)}KB`);
}
