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

  it("leaves a protocol-relative src alone rather than throwing", async () => {
    const out = await run('<img src="//cdn.example.com/a.png" alt="x">');
    expect(out).not.toMatch(/width=/);
  });

  // The src is a URL, not a path. Read as a path, it failed the build on a file
  // that was sitting right there under a name with a space in it.
  it("percent-decodes the src before looking for the file", async () => {
    const out = await run('<img src="/cover%2Epng" alt="x">');
    expect(out).toMatch(/width="\d+"/);
  });

  it("ignores a query string when looking for the file", async () => {
    const out = await run('<img src="/cover.png?v=2" alt="x">');
    expect(out).toMatch(/width="\d+"/);
  });

  // The old `join(dir, src)` let "/../cover.png" walk out of the image root and
  // stat whatever was above it. Parsing the src as a URL folds dot segments —
  // percent-encoded ones included — before anything touches the filesystem, so
  // a traversal now resolves to the same file the browser would have fetched.
  it.each(["/../cover.png", "/%2E%2E/cover.png"])(
    "contains a traversal in %s inside the image directory",
    async (src) => {
      const out = await run(`<img src="${src}" alt="x">`);
      expect(out).toMatch(/width="\d+"/);
    },
  );
});

/**
 * A raw `<img />` in an MDX body never becomes a hast `element`, so it cannot be
 * reached through rehype()'s HTML parser the way the cases above are. These
 * build the node MDX hands the plugin, which is the only way to cover the path
 * that used to let a typo'd src through without a word.
 */
describe("rehypeImageDimensions on raw MDX JSX", () => {
  function jsxTree(type: string, name: string) {
    return { type: "root", children: [{ type, name, attributes: [], children: [] }] };
  }

  const transform = (tree: unknown) => rehypeImageDimensions({ dir: FIXTURES })(tree);

  it("rejects a block-level raw <img /> and says what to write instead", async () => {
    await expect(transform(jsxTree("mdxJsxFlowElement", "img"))).rejects.toThrow(
      /markdown/,
    );
  });

  it("rejects an inline raw <img />", async () => {
    await expect(transform(jsxTree("mdxJsxTextElement", "img"))).rejects.toThrow(
      /markdown/,
    );
  });

  it("leaves a widget element alone", async () => {
    await expect(
      transform(jsxTree("mdxJsxFlowElement", "BeforeAfterSlider")),
    ).resolves.toBeUndefined();
  });
});
