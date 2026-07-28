import { describe, expect, it } from "vitest";
import { Prose } from "@/components/site/Prose";

/**
 * Prose is a pure wrapper: its whole behaviour is the class string it puts on
 * one div. Calling it directly reads that string without a renderer, which is
 * what lets a node-environment suite cover it at all. The `:has()` selectors it
 * asserts cannot be evaluated outside a browser, so this test checks that the
 * rules exist and are scoped, and the Playwright sweep checks that they apply.
 */
function classes(): string {
  const element = Prose({ children: null }) as { props: { className: string } };
  return element.props.className;
}

describe("Prose", () => {
  it("gives the full column to a paragraph that is nothing but an image", () => {
    expect(classes()).toContain("[&_p:has(>img:only-child)]:max-w-none");
  });

  // A markdown image inside a link — `[![alt](x)](/href)` — compiles to
  // `p > a > img`, so the image-only-child rule never matches it and a w-full
  // figure stayed squeezed inside the 68ch measure.
  it("gives the full column to a paragraph that is nothing but a linked image", () => {
    expect(classes()).toContain("[&_p:has(>a:only-child>img:only-child)]:max-w-none");
  });

  // The measure is the rule these exceptions carve out of, so an exception that
  // matches any paragraph merely containing an image takes the measure away
  // from ordinary prose.
  it("keeps the measure on a paragraph that merely contains an image", () => {
    for (const rule of classes().split(" ")) {
      if (!rule.includes("max-w-none")) continue;
      expect(rule, `${rule} matches a paragraph of prose with an inline image`).toContain(
        "only-child",
      );
    }
  });
});
