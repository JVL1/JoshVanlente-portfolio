import { describe, expect, it } from "vitest";
import remarkNoEsm from "@/lib/mdx/remark-no-esm";

/**
 * MDX parses `import` and `export` into a single mdast node type, `mdxjsEsm`,
 * whose `value` is the source text. These trees are what remark hands the
 * plugin; building them by hand keeps the test off remark-mdx, which is only a
 * transitive dependency here.
 */
function esmTree(value: string) {
  return { type: "root", children: [{ type: "mdxjsEsm", value }] };
}

const file = { path: "content/work/example.mdx" };
const transform = (tree: unknown) => remarkNoEsm()(tree, file);

describe("remarkNoEsm", () => {
  it("rejects an import, naming the file and the syntax", () => {
    expect(() => transform(esmTree('import Chart from "./chart";'))).toThrow(
      /content\/work\/example\.mdx/,
    );
    expect(() => transform(esmTree('import Chart from "./chart";'))).toThrow(
      /import Chart from "\.\/chart";/,
    );
  });

  it("rejects an export", () => {
    expect(() => transform(esmTree('export { a } from "./a";'))).toThrow(
      /export \{ a \} from "\.\/a";/,
    );
  });

  it("leaves a body with no ESM alone", () => {
    expect(() =>
      transform({ type: "root", children: [{ type: "paragraph", children: [] }] }),
    ).not.toThrow();
  });

  it("still names the syntax when the file has no path", () => {
    expect(() => remarkNoEsm()(esmTree('import "./a";'), {})).toThrow(/import "\.\/a";/);
  });
});
