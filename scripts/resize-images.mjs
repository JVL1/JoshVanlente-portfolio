// scripts/resize-images.mjs — run once; kept in the repo so it can run again.
import { unlink } from "node:fs/promises";
import sharp from "sharp";

// [source, width, quality]. The output path is derived, so it cannot drift from the source.
const JOBS = [
  ["content/work/deterministic-ai-photo-pipeline/cover.png", 1200],
  ["content/work/cutting-six-of-seven-steps/cover.jpg", 1200],
  ["content/work/all-in-one-rental-platform/cover.jpg", 1200],
  ["content/work/product-led-growth-strategy/cover.jpg", 1200],
  ["public/images/blog/pipeline-drift/staging-comparison.jpg", 1600],
  ["public/images/blog/pipeline-drift/declutter-comparison.jpg", 1600],
  ["public/images/blog/pipeline-drift/generative-passes.png", 1600],
  ["public/images/blog/pipeline-drift/drift-budget.png", 1600],
  ["public/images/projects/ai-re-photos/photo45-original.png", 1600, 59],
  ["public/images/projects/ai-re-photos/photo45-enhnaced.png", 1600, 78],
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
