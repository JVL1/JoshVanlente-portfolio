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

  it("names every offence in one message rather than one per build", () => {
    const tree = {
      type: "root",
      children: [
        { type: "mdxjsEsm", value: 'import A from "./a";' },
        { type: "mdxjsEsm", value: 'import B from "./b";' },
      ],
    };
    expect(() => transform(tree)).toThrow(/\.\/a/);
    expect(() => transform(tree)).toThrow(/\.\/b/);
  });

  /**
   * `import.meta` and a dynamic `import()` inside an MDX expression never
   * produce an `mdxjsEsm` node, and they compile with no top-level await, so
   * `new Function` accepts them. MDX emits a `_importMetaUrl` guard instead,
   * which throws during the server render with a message naming neither MDX nor
   * the file — the same crash the plugin exists to stop, reached by a different
   * road. These are the node types remark hands the plugin for them.
   */
  const expressionTree = (type: string, value: string, estree?: unknown) => ({
    type: "root",
    children: [{ type, value, ...(estree ? { data: { estree } } : {}) }],
  });

  // `meta` and `property` carry the two halves of a meta-property, and acorn
  // fills both: `import.meta` is meta "import", `new.target` is meta "new". The
  // names are what separates them, so a fixture that omits `meta` would let a
  // check on the node type alone look like a check on `import.meta`.
  const importMetaEstree = {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "MemberExpression",
          object: {
            type: "MetaProperty",
            meta: { type: "Identifier", name: "import" },
            property: { type: "Identifier", name: "meta" },
          },
          property: { type: "Identifier", name: "url" },
        },
      },
    ],
  };

  const dynamicImportEstree = {
    type: "Program",
    body: [
      {
        type: "ExpressionStatement",
        expression: {
          type: "ImportExpression",
          source: { type: "Literal", value: "./x" },
        },
      },
    ],
  };

  it.each(["mdxFlowExpression", "mdxTextExpression"])(
    "rejects import.meta in %s",
    (type) => {
      expect(() =>
        transform(expressionTree(type, "import.meta.url", importMetaEstree)),
      ).toThrow(/import\.meta\.url/);
    },
  );

  it("rejects a dynamic import written as an expression", () => {
    expect(() =>
      transform(
        expressionTree("mdxFlowExpression", 'import("./x")', dynamicImportEstree),
      ),
    ).toThrow(/import\("\.\/x"\)/);
  });

  it("rejects import.meta in a JSX attribute, which no walk reaches on its own", () => {
    expect(() =>
      transform({
        type: "root",
        children: [
          {
            type: "mdxJsxFlowElement",
            name: "span",
            attributes: [
              {
                type: "mdxJsxAttribute",
                name: "title",
                value: {
                  type: "mdxJsxAttributeValueExpression",
                  value: "import.meta.url",
                  data: { estree: importMetaEstree },
                },
              },
            ],
            children: [],
          },
        ],
      }),
    ).toThrow(/import\.meta\.url/);
  });

  /**
   * A spread attribute — `<span {...{title: import.meta.url}}>` — parses to
   * `mdxJsxExpressionAttribute`, whose `value` is the source string rather than
   * a node, so the check that reads `value.type` skips it in silence. Its
   * ESTree hangs off `attribute.data.estree` instead. Velite compiles the body
   * with exit 0 and writes the record; the compiled output still carries the
   * `_importMetaUrl` guard, which throws `Unexpected missing options.baseUrl`
   * inside `new Function(code)({ ...runtime })` in MDXContent.
   */
  const spreadAttributeTree = (elementType: string, value: string, estree: unknown) => ({
    type: "root",
    children: [
      {
        type: elementType,
        name: "span",
        attributes: [{ type: "mdxJsxExpressionAttribute", value, data: { estree } }],
        children: [],
      },
    ],
  });

  it.each(["mdxJsxFlowElement", "mdxJsxTextElement"])(
    "rejects import.meta spread into the attributes of a %s",
    (elementType) => {
      expect(() =>
        transform(
          spreadAttributeTree(
            elementType,
            "...{title: import.meta.url}",
            importMetaEstree,
          ),
        ),
      ).toThrow(/import\.meta\.url/);
    },
  );

  it("rejects a dynamic import spread into a JSX attribute", () => {
    expect(() =>
      transform(
        spreadAttributeTree(
          "mdxJsxTextElement",
          '...{t: import("./x")}',
          dynamicImportEstree,
        ),
      ),
    ).toThrow(/import\("\.\/x"\)/);
  });

  /**
   * `new.target` is a meta-property too, so rejecting the node type alone
   * refused an expression that compiles and renders exactly as written. The
   * guard is about reaching outside the body, and `new.target` reaches nowhere.
   */
  it("leaves new.target alone, which is a meta-property that stays inside the body", () => {
    expect(() =>
      transform(
        expressionTree("mdxFlowExpression", "(function(){ return String(new.target) })()", {
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "MetaProperty",
                meta: { type: "Identifier", name: "new" },
                property: { type: "Identifier", name: "target" },
              },
            },
          ],
        }),
      ),
    ).not.toThrow();
  });

  // The estree is what the check reads, so an expression that merely writes the
  // word in a string is left alone. Matching the source text instead would fail
  // the build on a write-up that quotes its own error message.
  it("leaves an expression that only mentions import in a string alone", () => {
    expect(() =>
      transform(
        expressionTree("mdxFlowExpression", '"import(\'./x\') is rejected"', {
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: { type: "Literal", value: "import('./x') is rejected" },
            },
          ],
        }),
      ),
    ).not.toThrow();
  });

  it("leaves an ordinary expression alone", () => {
    expect(() =>
      transform(
        expressionTree("mdxTextExpression", "1 + 1", {
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: { type: "BinaryExpression", operator: "+" },
            },
          ],
        }),
      ),
    ).not.toThrow();
  });
});
