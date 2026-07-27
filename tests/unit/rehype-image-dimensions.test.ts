import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { rehype } from "rehype";
import rehypeImageDimensions from "@/lib/mdx/rehype-image-dimensions";

// Resolved against the repository root rather than the process working
// directory, for the reason tests/unit/assets.test.ts records: Vitest does not
// set a worker's cwd, so a relative fixture path would resolve somewhere else
// when the suite is run from anywhere but the package root.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const FIXTURES = join(ROOT, "tests/fixtures/schema");

async function run(html: string, dir = FIXTURES) {
  return String(await rehype().use(rehypeImageDimensions, { dir }).process(html));
}

describe("rehypeImageDimensions", () => {
  it("stamps intrinsic width and height on an absolute image src", async () => {
    const out = await run('<img src="/cover.png" alt="x">');
    expect(out).toMatch(/width="\d+"/);
    expect(out).toMatch(/height="\d+"/);
  });

  it("leaves an existing width and height alone", async () => {
    const out = await run('<img src="/cover.png" alt="x" width="10" height="20">');
    expect(out).toContain('width="10"');
    expect(out).toContain('height="20"');
  });

  it("leaves a remote src alone rather than throwing", async () => {
    const out = await run('<img src="https://example.com/a.png" alt="x">');
    expect(out).not.toMatch(/width=/);
  });

  it("throws naming the src when a local file is missing", async () => {
    await expect(run('<img src="/nope.png" alt="x">')).rejects.toThrow(/nope\.png/);
  });
});
