import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { globSync, readFileSync, statSync } from "node:fs"; // fs.globSync requires Node 22+
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { webpBaseQIndex } from "./helpers/webp-quantizer";

// Every path below is resolved against the repository root rather than the
// process working directory. Vitest does not set a worker's cwd, so running the
// suite from anywhere but the package root used to leave the grep and both
// budget checks scanning nothing and passing on empty result sets.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const BUDGET_BYTES = 300 * 1024;
const RASTER_EXTENSIONS = "{png,jpg,jpeg,webp,avif,svg}";

const find = (pattern: string) => globSync(pattern, { cwd: ROOT });
const sizeOf = (relativePath: string) => statSync(join(ROOT, relativePath)).size;

/**
 * List files matching a pattern, distinguishing "found nothing" from "grep
 * broke". The earlier form piped through `|| true`, so a grep that failed
 * outright still exited 0 with empty stdout and read as a clean tree.
 */
function grepList(pattern: string, paths: string[]): string[] {
  try {
    const out = execFileSync("grep", ["-rl", pattern, ...paths], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return out.trim() ? out.trim().split("\n") : [];
  } catch (error) {
    const { status, stderr } = error as { status?: number; stderr?: string };
    if (status === 1) return []; // grep's documented "no matches" exit
    throw new Error(`grep failed with status ${status}: ${stderr ?? ""}`);
  }
}

describe("image assets", () => {
  it("references no .gif from content/ or src/", () => {
    expect(grepList("\\.gif", ["content/", "src/"])).toEqual([]);
  });

  it("ships no .gif under public/", () => {
    expect(find("public/**/*.gif")).toEqual([]);
  });

  it("keeps every cover under 300KB", () => {
    const covers = find("content/work/*/cover.*");
    expect(covers.length).toBe(6); // five published write-ups plus the draft fixture
    for (const c of covers) {
      expect(sizeOf(c), `${c} is ${Math.round(sizeOf(c) / 1024)}KB`).toBeLessThan(
        BUDGET_BYTES,
      );
    }
  });

  // Scoped to all of public/, matching the .gif check above, because the assets
  // most likely to arrive oversized are the ones that do not live under
  // public/images/ — an OG card or a favicon export lands at the top of
  // public/. SVG is included because an SVG carrying an embedded base64 raster
  // is unbounded in size while looking like a vector file.
  it("keeps every body image under 300KB", () => {
    const images = find(`public/**/*.${RASTER_EXTENSIONS}`);
    // Without this the loop below passes on an empty match, which is how a
    // mistyped pattern would silently retire the budget.
    expect(images.length).toBeGreaterThan(0);
    for (const f of images) {
      expect(sizeOf(f), `${f} is ${Math.round(sizeOf(f) / 1024)}KB`).toBeLessThan(
        BUDGET_BYTES,
      );
    }
  });

  // The comparison slider's whole job is letting a reader judge an enhancement,
  // so its two frames have to be presented on equal terms. Squeezing each file
  // under the budget independently once put them at quality 59 and 78, which
  // degraded the unenhanced frame more than the enhanced one — invisible in a
  // size check, and a thumb on the scale in the one widget that is supposed to
  // be evidence.
  //
  // Both halves of "equal terms" are asserted against the shipped files rather
  // than against the settings in resize-images.mjs, so a hand-encoded
  // replacement frame is covered too. Byte size is deliberately NOT compared:
  // the unenhanced frame is genuinely noisier, so equal bytes would be the
  // wrong assertion.
  //
  // Both dimensions are asserted, and the exact 16:9 is asserted too. The MDX
  // passes aspectRatio="16 / 9" to the slider, so a frame of any other shape
  // gets letterboxed or cropped by CSS at render time — and because the two
  // frames are cropped independently, they would be cropped by different
  // amounts and the wipe would not line up. The sources were 4032×3024 and
  // 2120×1552 (the enhancement pass reframed slightly), so both are centre-
  // cropped to 1280×720 on the way in. Asserting the ratio here rather than
  // only equality means a future replacement frame cannot quietly reintroduce
  // the mismatch by being consistently wrong in both files.
  describe("the comparison slider's two frames", () => {
    const dir = "public/images/projects/ai-re-photos";
    const before = `${dir}/photo45-original.webp`;
    const after = `${dir}/photo45-enhanced.webp`;
    const dimensions = async (p: string) => {
      const { width, height } = await sharp(join(ROOT, p)).metadata();
      return { width, height };
    };

    it("are the same size", async () => {
      expect(await dimensions(before)).toEqual(await dimensions(after));
    });

    it("match the 16:9 the slider declares", async () => {
      for (const p of [before, after]) {
        expect(await dimensions(p), p).toEqual({ width: 1280, height: 720 });
      }
    });

    it("are encoded at the same quality", () => {
      const q = (p: string) => webpBaseQIndex(readFileSync(join(ROOT, p)));
      expect(q(before)).toBe(q(after));
    });
  });
});
