import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { globSync, statSync } from "node:fs"; // fs.globSync requires Node 22+

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
});
