// scripts/resize-images.mjs — run once; kept in the repo so it can run again.
import { unlink } from "node:fs/promises";
import sharp from "sharp";

// [source, width, quality]. The output path is derived, so it cannot drift from the source.
//
// The two photo45 frames are the before and after of a comparison slider, and
// they are deliberately encoded identically. Hitting the 300KB budget by
// lowering quality per file put them at 59 and 78, which quietly degraded the
// unenhanced frame more than the enhanced one — a thumb on the scale in the one
// widget whose whole job is letting a reader judge the enhancement. Narrowing
// both to 1280px instead holds quality at 82 and lands at 293KB and 223KB. They
// render inside a slider at well under 760px, so the lost width costs nothing.
const JOBS = [
  ["content/work/deterministic-ai-photo-pipeline/cover.png", 1200],
  ["content/work/cutting-six-of-seven-steps/cover.jpg", 1200],
  ["content/work/all-in-one-rental-platform/cover.jpg", 1200],
  ["content/work/product-led-growth-strategy/cover.jpg", 1200],
  ["public/images/blog/pipeline-drift/staging-comparison.jpg", 1600],
  ["public/images/blog/pipeline-drift/declutter-comparison.jpg", 1600],
  ["public/images/blog/pipeline-drift/generative-passes.png", 1600],
  ["public/images/blog/pipeline-drift/drift-budget.png", 1600],
  ["public/images/projects/ai-re-photos/photo45-original.png", 1280],
  ["public/images/projects/ai-re-photos/photo45-enhnaced.png", 1280],
];

for (const [src, width, quality = 82] of JOBS) {
  // photo45-enhnaced.png is a committed typo; fix the name on the way out.
  const out = src
    .replace(/\.(png|jpe?g)$/i, ".webp")
    .replace("enhnaced", "enhanced");
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(out);
  await unlink(src);
  console.log(`${src} -> ${out}`);
}
