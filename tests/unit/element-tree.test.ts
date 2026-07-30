import { describe, expect, it } from "vitest";
import { createElement, Fragment, type ReactNode } from "react";
import {
  stringLeaves,
  styleObjects,
  UnreadableTree,
} from "./helpers/element-tree";

/**
 * The readers in helpers/element-tree.ts are themselves test infrastructure, and
 * a review round found a hole in them one level above the one the round before
 * had closed: they returned `[]` for anything they did not recognise, so an "and
 * nothing else" assertion could not tell "the tree contains nothing else" from
 * "the reader stopped looking".
 *
 * The first four refusals below were each reproduced against the real Open Graph
 * card, which shipped visibly wrong with the whole suite green. The rest close
 * the same shape of hole by reasoning rather than by demonstration: an image's
 * colours are in its bytes whether it arrives as `<img src>` or as a `url()` in a
 * style value, and no reader of a tree can see either.
 *
 * The tests are here so a later edit that widens the readers has to delete one of
 * them on purpose.
 *
 * Written with `createElement` rather than JSX because vitest.config.ts collects
 * `tests/unit/**\/*.test.ts` into the node project and `.tsx` only under
 * `tests/component`, where a DOM this file has no use for would be set up for it.
 */

/** `createElement` for an intrinsic element, which is what the readers accept. */
function el(
  tag: string,
  props: Record<string, unknown> = {},
  ...children: ReactNode[]
) {
  return createElement(tag, props, ...children);
}

describe("stringLeaves", () => {
  it("reads strings and numbers in render order, outermost first", () => {
    const tree = el("div", {}, "outer", el("span", {}, "inner", 42));

    expect(stringLeaves(tree)).toEqual(["outer", "inner", "42"]);
  });

  it("walks arrays and fragments, and skips what renders nothing", () => {
    const tree = el(
      "div",
      {},
      [el("span", {}, "a"), el("span", {}, "b")],
      createElement(Fragment, {}, "c"),
      null,
      undefined,
      false,
    );

    expect(stringLeaves(tree)).toEqual(["a", "b", "c"]);
  });
});

describe("styleObjects", () => {
  it("reads every style object, outermost first", () => {
    const outer = { background: "#0a0b0b" };
    const inner = { color: "#eceeec" };

    const tree = el("div", { style: outer }, el("p", { style: inner }));

    expect(styleObjects(tree)).toEqual([outer, inner]);
  });

  it("reports no style for an element that sets none", () => {
    expect(styleObjects(el("div", {}, "text"))).toEqual([]);
  });
});

describe("the readers refuse what they cannot read", () => {
  /** Both readers must refuse identically; a lax one is a hole of its own. */
  function bothRefuse(node: ReactNode, message: RegExp): void {
    expect(() => stringLeaves(node)).toThrow(UnreadableTree);
    expect(() => stringLeaves(node)).toThrow(message);
    expect(() => styleObjects(node)).toThrow(UnreadableTree);
    expect(() => styleObjects(node)).toThrow(message);
  }

  it("refuses a component-typed child, which hides its whole subtree", () => {
    // The one that defeats any prop allowlist, however complete.
    // `isValidElement(<Tagline/>)` is true, `props.children` is undefined, and
    // the function is never called, so the old walker returned []. A leg shipped
    // AVAILABLE FOR HIRE in #ff0000 this way at 74254 bytes, all 22 green.
    function Tagline() {
      return el("div", { style: { color: "#ff0000" } }, "AVAILABLE FOR HIRE");
    }

    bothRefuse(el("div", {}, createElement(Tagline)), /<Tagline> is a component/);
  });

  it("refuses an SVG presentation attribute", () => {
    // fill, stroke, stopColor, floodColor, and lightingColor set colour as
    // attributes rather than in style. `<svg><rect fill="#ff0000"/></svg>`
    // rendered at 70867 bytes with the suite green.
    bothRefuse(
      el("svg", {}, el("rect", { fill: "#ff0000" })),
      /<rect> carries fill/,
    );
  });

  it("refuses the tw prop", () => {
    // `tw="text-red-500"` on the name element moved the card's prerender hash
    // with tokens.test.ts green at 15/15. Note the asymmetry: `tw="bg-red-500"`
    // on the outer element changes nothing, because the explicit style
    // background wins. The hole opens where tw sets a property style leaves
    // unset, which is why refusing every unknown prop is the fix rather than
    // banning this one.
    bothRefuse(el("div", { tw: "text-red-500" }, "name"), /<div> carries tw/);
  });

  it("refuses a non-array iterable child", () => {
    // React and Satori both render this; the old walker skipped it.
    bothRefuse(
      el("div", {}, new Set(["extra"]) as unknown as ReactNode),
      /non-array iterable child \(Set\)/,
    );
  });

  it("refuses an <img>, whose colours are in bytes rather than in the tree", () => {
    bothRefuse(el("img", {}), /draws colour from image bytes/);
  });

  it("refuses a url() in a style value", () => {
    // Same hazard as <img>, reached from inside a style object instead.
    bothRefuse(
      el("div", { style: { backgroundImage: "url(data:image/png;base64,AA)" } }),
      /an image's colours are in its bytes/,
    );
  });

  it("refuses a style that is not a plain object", () => {
    bothRefuse(
      el("div", { style: "background:#ff0000" }),
      /style that is not a plain object/,
    );
  });

  it("refuses a style on a fragment, which styles nothing", () => {
    bothRefuse(
      createElement(Fragment, { style: { color: "#ff0000" } } as never, "x"),
      /a fragment carries style/,
    );
  });
});
