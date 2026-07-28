import { describe, expect, it } from "vitest";
import { Prose } from "@/components/site/Prose";

/**
 * Prose is a pure wrapper: its whole behaviour is the class string it puts on
 * one div. Calling it directly reads that string without a renderer, which is
 * what lets a node-environment suite cover it at all.
 *
 * What that buys is narrow, and worth stating plainly: a `:has()` selector
 * cannot be evaluated outside a browser, so every assertion here is about the
 * rule being present and scoped, never about what it selects on a real page.
 * Nothing in the repository checks the latter today — there is no Playwright
 * config and no e2e directory yet.
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

  // Every exception to the 68ch measure is scoped by `:only-child`, so a new
  // one cannot be added that drops the measure for any paragraph holding an
  // image. This is a check on the rule's shape, not on what it matches.
  //
  // It is deliberately not titled "keeps the measure on a paragraph that merely
  // contains an image", because that is false: CSS `:only-child` counts element
  // siblings and ignores text nodes, so `text ![alt](x) text` compiles to a
  // paragraph whose only element is the image and does lose the measure. Both
  // exceptions have that hole. Closing it needs a marker stamped during the MDX
  // transform, where text nodes can actually be inspected — see the review note
  // on Prose.tsx.
  it("scopes every measure exception with :only-child", () => {
    const exceptions = classes()
      .split(" ")
      .filter((rule) => rule.includes("max-w-none"));

    expect(exceptions.length, "no measure exceptions found to check").toBeGreaterThan(0);
    for (const rule of exceptions) {
      expect(rule, `${rule} is an unscoped exception to the measure`).toContain(
        ":only-child)]",
      );
    }
  });
});
