import { describe, expect, it } from "vitest";
import { Prose } from "@/components/site/Prose";

/**
 * Prose is a pure wrapper: its whole behaviour is the class string it puts on
 * one div. Calling it directly reads that string without a renderer, which is
 * what lets a node-environment suite cover it at all.
 *
 * What that buys is narrow, and worth stating plainly: this file can check that
 * a rule is present and how it is scoped, never what it selects on a real page.
 * The selection logic itself now lives in src/lib/mdx/rehype-figure-paragraph.ts
 * and is tested there against real trees, which is the point of having moved it
 * out of CSS.
 */
function classes(): string {
  const element = Prose({ children: null }) as { props: { className: string } };
  return element.props.className;
}

describe("Prose", () => {
  it("gives the full column to a paragraph the transform marked as a figure", () => {
    expect(classes()).toContain("[&_p[data-figure]]:max-w-none");
  });

  /**
   * There is one exception to the 68ch measure and it is the marker.
   *
   * The two rules this replaced were `p:has(>img:only-child)` and
   * `p:has(>a:only-child>img:only-child)`, and both had the same hole: CSS
   * `:only-child` counts element siblings and ignores text nodes, so
   * `text ![alt](x) text` is a paragraph whose only *element* is the image and
   * it lost the measure. No `:has()` rule can close that, because the thing to
   * inspect is a text node. Adding one back would reopen it, so this asserts
   * the exception stays single and stays the marker.
   */
  it("has exactly one measure exception, and it is the figure marker", () => {
    const exceptions = classes()
      .split(" ")
      .filter((rule) => rule.includes("max-w-none"));

    expect(exceptions).toEqual(["[&_p[data-figure]]:max-w-none"]);
  });
});
