import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { globSync, statSync } from "node:fs"; // fs.globSync requires Node 22+
import sharp from "sharp";

describe("image assets", () => {
  it("references no .gif from content/ or src/", () => {
    const hits = execFileSync(
      "bash",
      ["-c", "grep -rl '\\.gif' content/ src/ || true"],
      { encoding: "utf8" },
    ).trim();
    expect(hits).toBe("");
  });

  it("ships no .gif under public/", () => {
    expect(globSync("public/**/*.gif")).toEqual([]);
  });

  it("keeps every cover under 300KB", () => {
    const covers = globSync("content/work/*/cover.*");
    expect(covers.length).toBe(6); // five published write-ups plus the draft fixture
    for (const c of covers) {
      expect(
        statSync(c).size,
        `${c} is ${Math.round(statSync(c).size / 1024)}KB`,
      ).toBeLessThan(300 * 1024);
    }
  });

  it("keeps every body image under 300KB", () => {
    for (const f of globSync("public/images/**/*.{png,jpg,jpeg,webp,avif}")) {
      expect(
        statSync(f).size,
        `${f} is ${Math.round(statSync(f).size / 1024)}KB`,
      ).toBeLessThan(300 * 1024);
    }
  });

  // The comparison slider's whole job is letting a reader judge an enhancement,
  // so its two frames have to be presented on equal terms. Squeezing each file
  // under the budget independently once put them at quality 59 and 78, which
  // degraded the unenhanced frame more than the enhanced one — invisible in a
  // size check, and a thumb on the scale in the one widget that is supposed to
  // be evidence. Equal width is the content-independent half of that invariant;
  // equal quality lives in resize-images.mjs, where neither frame may carry a
  // per-file override. Byte size is deliberately NOT compared: the unenhanced
  // frame is genuinely noisier, so equal bytes would be the wrong assertion.
  it("presents both slider frames at the same width", async () => {
    const dir = "public/images/projects/ai-re-photos";
    const [before, after] = await Promise.all([
      sharp(`${dir}/photo45-original.webp`).metadata(),
      sharp(`${dir}/photo45-enhanced.webp`).metadata(),
    ]);
    expect(before.width).toBe(after.width);
  });
});
