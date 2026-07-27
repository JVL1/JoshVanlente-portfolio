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

// Every job is [source, width] or [source, width, height]. Supplying a height
// centre-crops to that exact box; supplying only a width scales and keeps the
// source's own shape. The output path is derived from the source, so it cannot
// drift, and quality is a single constant for the same reason: a per-job quality
// override is the exact affordance that produced the bug below.
const QUALITY = 82;

//
// The two photo45 frames are the before and after of a comparison slider, and
// they are deliberately processed identically — same box, same quality.
//
// Two separate bugs came out of treating them as ordinary images. Hitting the
// 300KB budget by lowering quality per file put them at 59 and 78, which
// degraded the unenhanced frame more than the enhanced one — a thumb on the
// scale in the one widget whose whole job is letting a reader judge the
// enhancement. And the sources were 4032×3024 and 2120×1552, because the
// enhancement pass reframed slightly, so scaling to a common width still left
// them different heights; against the MDX's aspectRatio="16 / 9" they would
// have been cropped by different amounts and the wipe would not have lined up.
//
// Both are fixed by cropping to a shared 1280×720 at quality 82, which lands at
// 229KB and 177KB. They render inside a slider at well under 760px, so the lost
// width costs nothing.
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
  ["public/images/projects/ai-re-photos/photo45-original.png", 1280, 720],
  ["public/images/projects/ai-re-photos/photo45-enhnaced.png", 1280, 720],
];

for (const [src, width, height] of JOBS) {
  // photo45-enhnaced.png is a committed typo; fix the name on the way out.
  const out = src
    .replace(/\.(png|jpe?g)$/i, ".webp")
    .replace("enhnaced", "enhanced");
  // withoutEnlargement only applies to the scale-to-width case. A job that
  // names a height is asking for an exact box, and `cover` fills it by
  // centre-cropping the longer axis.
  const resize = height
    ? { width, height, fit: "cover", position: "centre" }
    : { width, withoutEnlargement: true };
  await sharp(src).resize(resize).webp({ quality: QUALITY }).toFile(out);
  await unlink(src);
  console.log(`${src} -> ${out}`);
}
