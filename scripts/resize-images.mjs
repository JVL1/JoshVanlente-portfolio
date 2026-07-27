// scripts/resize-images.mjs — the one-time conversion that moved this repo's
// images to WebP, kept so the settings behind every shipped image stay readable.
//
// It cannot be re-run as it stands. Each source is deleted once it converts, and
// all ten are already gone from the working tree, so running it today fails on
// the first job with "Input file is missing". Restore the sources first:
//
//   git checkout 7a8489b -- public/images content/work
//   node scripts/resize-images.mjs
//
// A run that fails partway is not resumable either, because the retry dies on
// the first already-converted job rather than on the one that failed. To convert
// a newly added image, replace JOBS with just that image.
import { unlink } from "node:fs/promises";
import sharp from "sharp";

// Every job is [source, width]. The output path is derived from the source, so
// it cannot drift, and quality is a single constant for the same reason: a
// per-job quality override is the exact affordance that produced the bug below.
const QUALITY = 82;

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
  // generative-passes and drift-budget used to convert here from PNG exports.
  // They are hand-authored SVG, and their live source is now the SVG itself, so
  // they moved to scripts/export-charts.mjs — which is re-runnable and deletes
  // nothing. Running a vector source through this script would unlink the only
  // editable copy, which is how those two files were lost once already.
  ["public/images/projects/ai-re-photos/photo45-original.png", 1280],
  ["public/images/projects/ai-re-photos/photo45-enhnaced.png", 1280],
];

for (const [src, width] of JOBS) {
  // photo45-enhnaced.png is a committed typo; fix the name on the way out.
  const out = src
    .replace(/\.(png|jpe?g)$/i, ".webp")
    .replace("enhnaced", "enhanced");
  await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);
  await unlink(src);
  console.log(`${src} -> ${out}`);
}
