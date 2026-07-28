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

// The fixture is 64 wide and 40 tall. Asserting the literals rather than /\d+/
// is what catches the two being swapped, which a digit match cannot see.
describe("rehypeImageDimensions", () => {
  it("stamps intrinsic width and height on an absolute image src", async () => {
    const out = await run('<img src="/cover.png" alt="x">');
    expect(out).toContain('width="64"');
    expect(out).toContain('height="40"');
  });

  it("leaves an existing width and height alone", async () => {
    const out = await run('<img src="/cover.png" alt="x" width="10" height="20">');
    expect(out).toContain('width="10"');
    expect(out).toContain('height="20"');
  });

  // An author who sets one dimension has made a choice, so it is kept — but
  // next/image derives nothing: registry.tsx hands it Number(height), and a
  // missing half arrives as NaN and throws `invalid "height" property`. The
  // missing half is derived here instead. 10 wide on a 64x40 source is 6 tall.
  it("keeps an authored width and derives the missing height", async () => {
    const out = await run('<img src="/cover.png" alt="x" width="10">');
    expect(out).toContain('width="10"');
    expect(out).toContain('height="6"');
  });

  // 20 tall on a 64x40 source is 32 wide.
  it("keeps an authored height and derives the missing width", async () => {
    const out = await run('<img src="/cover.png" alt="x" height="20">');
    expect(out).toContain('height="20"');
    expect(out).toContain('width="32"');
  });

  // Zero is a number next/image rejects, and hast turns both `width=""` and a
  // valueless `width` into the empty string. Treating any of the three as an
  // authored choice shipped an image that cannot render, so the test is for a
  // usable value rather than a present one.
  it.each(['width="0"', 'width=""', "width", 'width="auto"'])(
    "stamps both dimensions over an unusable %s",
    async (attribute) => {
      const out = await run(`<img src="/cover.png" alt="x" ${attribute}>`);
      expect(out).toContain('width="64"');
      expect(out).toContain('height="40"');
    },
  );

  // The missing-file check is the guarantee this plugin exists to give, and an
  // authored dimension used to skip straight past it.
  it("still fails on a missing file when a dimension is authored", async () => {
    await expect(run('<img src="/nope.png" alt="x" width="10">')).rejects.toThrow(
      /nope\.png/,
    );
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
      expect(out).toContain('width="64"');
    },
  );

  // The throws live inside the visitor, but the sharp jobs are awaited after the
  // walk. Throwing straight out of the visitor skips that await, so a job that
  // is already running rejects with nobody listening — and Node kills the build
  // on the unhandled rejection, printing sharp's anonymous format error instead
  // of the message that names the file the author actually got wrong.
  it("settles in-flight image jobs before throwing the authored error", async () => {
    const unhandled: unknown[] = [];
    const record = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", record);

    try {
      await expect(
        run('<img src="/not-an-image.png" alt="a"><img src="/nope.png" alt="b">'),
      ).rejects.toThrow(/nope\.png/);
      // Give the orphaned sharp promise time to reject and Node time to notice.
      await new Promise((resolve) => setTimeout(resolve, 250));
    } finally {
      process.off("unhandledRejection", record);
    }

    expect(unhandled, "a sharp job rejected with no handler attached").toEqual([]);
  });

  // Throwing only the first error made three typos cost three build cycles,
  // each one revealing the next.
  it("names every bad image at once rather than one per build", async () => {
    const failure = await run(
      '<img src="/nope.png" alt="a"><img src="/also-nope.png" alt="b">',
    ).catch((error: Error) => error);

    expect((failure as Error).message).toMatch(/nope\.png/);
    expect((failure as Error).message).toMatch(/also-nope\.png/);
  });

  it("reports a file sharp cannot read, naming the src", async () => {
    await expect(run('<img src="/not-an-image.png" alt="a">')).rejects.toThrow(
      /not-an-image\.png/,
    );
  });
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
